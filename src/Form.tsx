import {
  Component,
  createRef,
  RefObject,
  ReactNode,
  createContext,
  Fragment,
} from 'react';
import { Field } from './Field';
import {
  Config,
  Context,
  IndexObject,
  Error,
  FormProp,
  ChangeType,
  UpdateReason,
} from './types';
import * as React from 'react';
import { FieldConfig } from '.';

type GetFieldsStackFilterFn = (
  name: string,
  fieldConfig: FieldConfig
) => boolean;

type API = {
  fields: IndexObject<ReactNode>;
  getFieldsStack: (filter?: GetFieldsStackFilterFn) => ReactNode[];
  submitForm: () => void;
  resetForm: () => void;
  focusField: (name: string) => void;
  subscribe: (cb: SubscribeCallback) => void;
};

type Props = {
  children: (args: API) => any;
  context: Context;
  onSubmit: (
    originalValues: IndexObject,
    transformedValues: IndexObject
  ) => void;
  config: Config;
  applyProps?: (name: string, config: FieldConfig) => IndexObject | undefined;
};

type State = {
  fields: IndexObject;
};

type SubscribeCallback = (args: FormProp, reason: UpdateReason) => void;

export type Broadcast = (name: string, type: ChangeType) => void;

export const FormContext = createContext<API>({} as API);

export class Form extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      fields: {},
    };
  }

  fieldRefs: IndexObject<RefObject<Field>> = {};
  subscribers: SubscribeCallback[] = [];

  componentDidMount() {
    const fields: IndexObject = {};
    for (const [name, c] of Object.entries(this.props.config)) {
      this.fieldRefs[name] = createRef();
      fields[name] = (
        <Field
          ref={this.fieldRefs[name]}
          config={c}
          onMount={() => {
            setTimeout(() => {
              this.updateField(name);
            });
          }}
          initialState={c.initState ? c.initState(this.props.context) : {}}
          broadcast={this.broadcast}
          name={name}
        />
      );
    }
    this.setState({ fields });
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.context !== this.props.context) {
      this.updateAllFields();
    }
  }

  updateAllFields = () => {
    Object.keys(this.fieldRefs).forEach((name) => this.updateField(name));
  };

  getValues = (isTransform?: boolean) => {
    return Object.entries(this.fieldRefs).reduce<IndexObject>(
      (values, [name, r]) => {
        if (!r.current) return values;
        const fieldConfig = this.props.config[name];
        if (isTransform) {
          values[name] = fieldConfig.transform
            ? fieldConfig.transform(
                this.props.context,
                this.getFormProp(),
                r.current.getValue()
              )
            : r.current.getValue();
        } else {
          values[name] = r.current.getValue();
        }

        return values;
      },
      {}
    );
  };

  getErrors = () => {
    return Object.entries(this.fieldRefs).reduce<IndexObject<Error>>(
      (errors, [name, r]) => {
        if (!r.current) return errors;
        const error = r.current.getError();
        if (error === undefined) return errors;
        errors[name] = error;
        return errors;
      },
      {}
    );
  };

  getFormProp = () => {
    return {
      values: this.getValues(),
      errors: this.getErrors(),
    };
  };

  getFormPropWithMutations = () => {
    return {
      ...this.getFormProp(),
      setValue: (name: string, value: any) => {
        const fieldRef = this.fieldRefs[name].current;
        if (!fieldRef) return;
        fieldRef.setValue(value);
      },
      setError: (name: string, error: Error) => {
        const fieldRef = this.fieldRefs[name].current;
        if (!fieldRef) return;
        fieldRef.setError(error);
      },
      validateField: (name: string) => {
        this.validateField(name);
      },
    };
  };

  updateField = (name: string, cb?: () => void) => {
    const fieldRef = this.fieldRefs[name].current;
    if (!fieldRef) return;
    fieldRef.update(
      {
        ...this.props.config[name].props(
          this.props.context,
          this.getFormProp()
        ),
        ...(this.props.applyProps
          ? this.props.applyProps(name, this.props.config[name])
          : {}),
      },
      cb
    );
  };

  resetField = (name: string) => {
    const fieldRef = this.fieldRefs[name].current;
    if (!fieldRef) return;
    const fieldConfig = this.props.config[name];
    fieldRef.initState(
      fieldConfig.initState ? fieldConfig.initState(this.props.context) : {}
    );
  };

  broadcast = (name: string, type: ChangeType) => {
    Object.entries(this.props.config).forEach(([n, c]) => {
      if (c.deps && c.deps.includes(name)) {
        this.updateField(n, () => {
          this.validateField(n);
        });
        if (c.effect) {
          c.effect(this.props.context, this.getFormPropWithMutations(), {
            name,
            type,
          });
        }
      }
    });
    this.subscribers.forEach((cb) =>
      cb(this.getFormProp(), {
        name,
        type,
      })
    );
  };

  validateField = (name: string) => {
    const fieldRef = this.fieldRefs[name].current;
    if (!fieldRef) return;
    fieldRef.validate();
  };

  isValid = () => {
    const isInvalid = Object.values(this.getErrors()).some(
      (err) => err !== undefined
    );
    return !isInvalid;
  };

  submitForm = () => {
    Object.keys(this.props.config).forEach((name) => {
      this.validateField(name);
    });
    setTimeout(() => {
      if (this.isValid()) {
        this.props.onSubmit(this.getValues(), this.getValues(true));
      }
    });
  };

  resetForm = () => {
    Object.keys(this.props.config).forEach((name) => {
      this.resetField(name);
    });
  };

  getFieldsStack = (filter?: GetFieldsStackFilterFn) => {
    return Object.entries(this.props.config)
      .filter(([name, c]) => (filter ? filter(name, c) : true))
      .map(([name, _]) => {
        return <Fragment key={name}>{this.state.fields[name]}</Fragment>;
      });
  };

  subscribe = (cb: SubscribeCallback) => {
    this.subscribers.push(cb);
  };

  focusField = (name: string) => {
    this.fieldRefs[name].current?.focusField();
  };

  createAPIProps = () => {
    return {
      fields: this.state.fields,
      submitForm: this.submitForm,
      resetForm: this.resetForm,
      getFieldsStack: this.getFieldsStack,
      focusField: this.focusField,
      subscribe: this.subscribe,
    };
  };

  render() {
    return (
      <FormContext.Provider value={this.createAPIProps()}>
        {this.props.children(this.createAPIProps())}
      </FormContext.Provider>
    );
  }
}
