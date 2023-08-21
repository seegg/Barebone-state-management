# [Barebone](src/barebone)
Simple React state management using hooks and with typing for TS.

[Demo](https://seegg.github.io/barebone-demo/) using
a simple counter shared between sibling components.

## Creating the store
The `createStore` function returns an object
```ts
const {useStore, actions, asyncActions, store} = createStore({...storeOptions});
```
`useStore` is for accessing the store inside a functional component. 
`actions` contains functions defined by the user for interacting with 
the store, both synchronous and asynchronous actions are accessed through
`actions`.

The `name` option is use to identify the store, when accessing the store
through the `useStore` hook, the state is selected through `state.< name >`.

When defining `actions` the first param is the state, any additional
param can be included for passing in additional data when the `action`
is called. After the store is created the default params are hidden and only 
the user defined ones will be exposed.

When updating a state, a new state must be returned instead of mutating
the existing one.

To use types with TS, just defined them as needed when creating the store.

```ts
import {createStore} from './barebone'

export const {useStore, actions, store} = createStore({
  name: 'counter',
  initialState: { count: 0 },
  actions: {
    increment: (state) => ({ count: state.count + 1 }),
    setCounterTo: (state, value: number) => ({ ...state, count: value }),
    addMultiple: (state, one: number, two: number) => ({
      ...state,
      count: state.count + one + two,
    }),
    reset: () => ({ count: 0 })
  },
});

...

// To use the addMultiple action:
actions.addMultiple(2, 3);

```
## Async Actions

For async actions, add them under `asyncActions` when creating the store.
Unlike synchronous actions where a new state is returned, async actions 
accepts a `setState` function as the first param, the new state needs to 
be pass to `setState` when updating the store. The state is instead the
second param.

```ts
import {createStore} from './barebone'

export const {useStore, asyncActions, store} = createStore({
  name: 'counter',
  initialState: { count: 0 },
  asyncActions: {
    // Make a HTTP request to fetch a counter value.
    setCounterAsync: async (setState, state, url: number) => {
      console.log('Fetching new counter.');
      const request = await fetch(url).json();
      setState({count: request.count});
    }
  }
});

...

// To use the setCounterAsync action:
asyncActions.setCounterAsync('my url');

```
## Using the store
Import the hook and actions from where the store is defined.`useStore` 
accepts a select function that has the store as the first param which
can be use to narrow down the return value for the hook.

Actions are not restricted to react components and can be use anywhere.
```ts
import {useCounterStore, counterActions} from './counterStore'

const Counter = () => {
  const count = useCounterStore(state => state.counter.count);

  const setCountTo = (value: number) => {
    counterActions.setCounterTo(value);
  }

  return(
    ...
    <button onClick={counterActions.increment}>
          count is {count}
    </button>

    <input type="text"  />

    ...
  )
}

```
## Conditional updates
`useStore` also accepts an additional function to check if the local 
state should be updated when the store is updated. This can be
use to avoid unnecessary rerenders.

The check is done when the store is updating. The new state and
the old state is pass into the function as the first and second argument.
It returns a boolean indicating whether the local state should be
updated or not.

If no function is defined, the default behaviour for the check is to do
a strict comparison `===` between the old state and the new state using the
same state property as the one returned from `useStore` using the select
function.

```ts
const Counter = () => {
  // Default bahaviour
  const count = useCounterStore(
    state => state.counter.count,
    (newState, oldState) => newState.counter.count !== oldState.counter.count
  );
  
  // Only update the local count if the store count is bigger by at least 3.
  const count = useCounterStore(
    state => state.counter.count,
    (newState) => newState.counter.count - count > 3
  );

 // Update the local state every time the store updates.
  const count = useCounterStore(
    state => state.counter.count,
    () => true
  );
}

```
