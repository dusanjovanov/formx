# FormX

![FormX](https://github.com/dusanjovanov/formx/blob/master/logo.png 'FormX')

Tiny, very fast React form library.

[![npm](https://badge.fury.io/js/%40formx%2Fformx.svg)](https://www.npmjs.com/package/@formx/formx)

## Install

```
npm install @formx/formx
```

## Usage

1. Create a config outside of React:

```javascript
const config = {
  firstName: {
    component: TextField,
    props: (context) => ({
      label: 'First name',
      schema: yup.string().required(),
    }),
    initState: (context) => ({
      value: context.person?.firstName,
    }),
  },
  lastName: {
    component: TextField,
    props: (context, form) => ({
      label: 'Last name',
      schema: yup.string().required(),
    }),
    initState: (context) => ({
      value: context.person?.lastName,
    }),
  },
  fullName: {
    component: TextField,
    props: (context, form) => ({
      label: 'Full name',
      schema: yup.string().required(),
    }),
    deps: ['firstName', 'lastName'],
    effect: (context, form) => {
      form.setValue(
        'fullName',
        `${form.values.firstName} ${form.values.lastName}`
      );
    },
    initState: (context) => ({
      value: `${context.person?.firstName} ${context.person?.lastName}`,
    }),
  },
};
```

2. Create a component thats going to be rendered for the field. A component is just a plain React component.

Example:

```javascript
const TextField = ({ label, field }) => {
  return (
    <div>
      <h4>{label}</h4>
      <input
        type="text"
        {...field}
        value={field.value ?? ''}
        onChange={(e) => field.onChange(e.target.value)}
      />
      {field.error}
    </div>
  );
};
```

The only special thing is the field prop which contains `value, error, onChange, onBlur`

3. Put the `Form` component in your Form page and pass it the `config, context, onSubmit`:

```javascript
export const App = () => {
  const [person, setPerson] = useState < any > null;
  const [isLoading, setIsLoading] = useState(false);
  const formRef = React.useRef < Form > null;

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const person = await getPerson();
      setPerson(person);
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!formRef.current) return;
    formRef.current.resetForm();
  }, [person]);

  const context = {
    person,
  };

  return (
    <Form
      config={config}
      context={context}
      onSubmit={(data) => console.log(data)}
      ref={formRef}
    >
      {({ fields, submitForm, resetForm }) => {
        return (
          <div>
            {isLoading && <h1>Loading person...</h1>}
            {fields.firstName}
            {fields.lastName}
            <button onClick={() => submitForm()}>Submit</button>
            <button onClick={() => resetForm()}>Reset</button>
          </div>
        );
      }}
    </Form>
  );
};
```

## Concepts

### Context:

Anything dynamic (or static) that you need for your form fields. Could be, for example:

1. Bussiness object from the server
2. Some state you have
3. The t function from `react-i18next` for translating your labels, errors..etc.
4. Redux dispatch

### Validation

You can pass a `Yup` schema from the `props` function. It will validate on every change and blur.
Each field is validated separately, except on submit when all fields are validated, and submit is prevented if there are errors.

### Updating

Fields are updated (rendered) imperatively only when something changes concerning that field (it's value, error, props).
There is also a `deps` field in the field config which tells `formx` to update that field also when the fields set in `deps` are updated.
You can use other fields values from the second argument of the props function - `form`

### Props

Anything you wish to pass to your component. The only prop with special treatment is `schema` which is used for validation.

### Deps

Deps are field names upon which your field depends on. Each time one of the fields in the array gets updated (value, error), that field gets updated too.

### initState function

`initState` is called on mount of each field, and when you call `resetForm`. You can pass `value` and `error` here.

### Effect

`effect` function is called every time one of the fields in `deps` updates. You can do mutations here.
You get `setValue` and `setError` in the second argument (`form`)

## Why?

Big forms (30+ fields) are hard to maintain.
The idea is to keep everything related to your form (initial values, validation rules, appearance, effects, bussiness logic...) in one place - a configuration.
Also, performance - in this library only what needs to be rendered, gets rendered.

## Plans

- Effects for fields - so you can set a value imperatively when something happens (A fields value changes). This is useful for calculcated fields.
- Add a validate function for fields also.

<!-- anything below this line will be safe from template removal -->
