export type IndexObject<T = any> = {
  [key: string]: T;
};

export type Config<Context = IndexObject> = IndexObject<FieldConfig<Context>>;

export type Error = string | undefined;

export type Context = IndexObject;

export type FormProp = {
  values: IndexObject;
  errors: IndexObject<Error>;
};

export type PropsObject = {
  schema?: any;
  validate?: (value: any) => undefined | string | Promise<any>;
  [key: string]: any;
};

export type FormPropWithMutations = FormProp & {
  setValue: (name: string, value: any) => void;
  setError: (name: string, error: Error) => void;
  validateField: (name: string) => void;
};

export type FieldConfig<Context = IndexObject, Props = PropsObject> = {
  component: React.FC<Props>;
  props: (context: Context, form: FormProp) => Props;
  deps?: string[];
  initState?: (
    context: Context
  ) => {
    value?: any;
    error?: string | undefined;
  };
  effect?: (
    context: Context,
    form: FormPropWithMutations,
    reason: {
      name: string;
      type: ChangeType;
    }
  ) => void;
  transform?: (context: Context, form: FormProp, value: any) => any;
  [key: string]: any;
};

export type ChangeType = 'value' | 'error' | 'blur';

export type FieldProp = {
  value:any;
  error:Error;
  onChange:(value: any) => void; 
  onBlur: () => void;
  focusRef:React.RefObject<{[key:string]:any}>
};