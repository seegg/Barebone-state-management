# [Barebone](src/barebone)
Simple and easy to use React state management using hooks and typing for TS.

### [Demo](https://seegg.github.io/barebone-demo/) 
using a simple counter shared between sibling components.

## Creating the store
Use the `createStore` function to create a store by passing in a `storeOptions`
object.

To use types with the store, just defined them as needed.

```ts
const {useStore, actions, asyncActions, store} = createStore({...storeOptions});
```

```ts
// storeOptions:
{
  /**
   * Name associated with the store. The state values are accessed
   * through store.<name> from either the useStore hook or directly
   * through the store.
  */
  name: string;
  /** The initial values for the state. */
  initialState: State;
  /** 
   * Synchronous actions use for manipulating the store. Must return
   * A new state instead of manipulating the existing one.
  */
  actions: {
    [key: string]: (state: State, ...args: unknown[]) => State
    };
  /** 
   * Async actions works the same way as sync actions.
  */
  asyncActions: {
    [key: string]: (state: State, ...args: unknown[]) => Promise<State>
  };
}
```
## Actions
When adding synchronous actions to the store the state is made available
as the first param. Actions can included any additional number of params 
as needed. After the actions are created, the state param will be hidden.
To update the store, a new state must be returned instead of
mutating the existing one.

When using multiple actions at the same time, each action will be called
in the order that it's defined. Any action that follows another will always
act on the latest store state.

```ts
import {createStore} from 'barebone'

interface Counter {
  count: number;
}

const initialState: Counter = {
  count: 0
}

export const {useStore, actions, store} = createStore({
  name: 'counter',
  initialState,
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

// Using multiple actions at the same time.
const increment2x = () => {
  actions.increment();
  actions.addMultiple(2, 3);
}


```
## Async Actions

Async actions are added under `asyncActions`. Unlike synchronous actions
the first param for an async action is a `getState` function that return 
the state when called. This means that to access the state inside of an 
async action it's done so through the return value of this `getState` function. 
Other than that both types of actions works the same way.


```ts
import {createStore} from 'barebone'

export const {useStore, asyncActions, store} = createStore({
  name: 'counter',
  initialState: { count: 0 },
  asyncActions: {
    // Make a request to fetch a new counter value.
    setCounterAsync: async (getState: () => State, url: string) => {
      console.log('Fetching new counter.');
      const state = getState();
      const request = await fetch(url).json();
      return {...state, count: request.count};
    }
  }
});

...

// To use the setCounterAsync action:
asyncActions.setCounterAsync('my url');

```
## Accessing the store
Add the `useStore` hook to any component that wants access to the
the store. Use a select function to filter the store properties.

When selecting multiple properties, return them as an array.

The state is available through `store[name]` where `name` is the same
as the one defined when creating the store.

`useStore` by default will only update the local state if the properties
filtered by the select function changes. To change this behaviour see 
[conditional updates.](https://github.com/seegg/Barebone-state-management#conditional-updates)

Actions are not restricted to react components and can be use anywhere.

To access the store outside of a react component, use the `store` property
that was returned as part of `createStore`.

```ts
import {useCounterStore, counterActions} from './counterStore'

const Counter = () => {
  const count = useCounterStore(store => store.counter.count);

  // Selecting multiple properties.
  const counter = useCounterStore(
    store => [store.counter.count, store.counter.isUpdating],
  );

  const setCountTo10 = () => {
    counterActions.setCounterTo(10);
  }

  return(
    ...
    <button onClick={counterActions.increment}>
          count is {count}
    </button>

    <button onClick={setCountTo10} >
          set counter to 10
    </button>

    ...
  )
}

```
## Conditional updates
The `useStore` hook also accepts an additional function to check if the local 
state should be updated when the store updates. This can be use to avoid 
unnecessary rerenders.

The new store and the old store is available as the first and second argument.

If no function is provided, the default behaviour is to do a strict comparison 
`===` between the old state and the new state to check if the properties selected
by `useStore` has changed.

```ts
const Counter = () => {
  // The default behaviour in this example is to check if the `count`
  // property has changed before updating the local state.
  const count = useCounterStore(
    store => store.counter.count,
  );

  // For hooks returning multiple values as an array, the same check
  // is done for each element when left to the default behaviour.
  const count = useCounterStore(
    store => [store.counter.count, store.counter.isUpdating],
  );

  
  // Only update the local count if the store count is bigger by at least 3.
  const count = useCounterStore(
    store => store.counter.count,
    (newStore) => newStore.counter.count - count > 3
  );

 // Update the local state every time the store updates.
  const count = useCounterStore(
    Store => Store.counter.count,
    () => true
  );
}

```
