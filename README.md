# [Barebone](src/barebone)
Simple and easy to use React state management using hooks and typing for TS.

### [Demo](https://seegg.github.io/barebone-demo/) 
using a simple counter shared between sibling components.

## Creating the store
Use the `createStore` function to create a store by passing in a `storeOptions`
object.

To use types, just defined them as needed when creating the store.

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

If an action depends on the result of another action, instead of using
one action inside of another it should be compose together in wrapper
outside of the store. This is because the state param does not receive
any updates.

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

// Composite action:
const increment2x = () => {
  actions.increment();
  actions.increment();
}


```
## Async Actions

Async actions are added under `asyncActions`. It works the same as synchronous 
actions except with the ability to perform async operations before returning 
the new state.

```ts
import {createStore} from 'barebone'

export const {useStore, asyncActions, store} = createStore({
  name: 'counter',
  initialState: { count: 0 },
  asyncActions: {
    // Make a request to fetch a new counter value.
    setCounterAsync: async (state, url: string) => {
      console.log('Fetching new counter.');
      const request = await fetch(url).json();
      return {...state, count: request.count};
    }
  }
});

...

// To use the setCounterAsync action:
asyncActions.setCounterAsync('my url');

```
## Using the store
Add the `useStore` hook to any component that needs to access the
the store. Provide a function that accepts the store as argument
to `useStore` to select what is returned.

`useStore` by default will only update the local state if the properties
it selected changes in the store. To change this behaviour see 
[conditional updates.](https://github.com/seegg/Barebone-state-management#conditional-updates)

Actions are not restricted to react components and can be use anywhere.

To access the store outside of a react component, use the `store`
that was returned as part of `createStore`.

```ts
import {useCounterStore, counterActions} from './counterStore'

const Counter = () => {
  const count = useCounterStore(store => store.counter.count);

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

The new store and the old store is available to this function as the first
and second argument.

If no function is provided, the default behaviour is to do a strict comparison 
`===` between the old state and the new state to check if the properties selected
by `useStore` has changed.

```ts
const Counter = () => {
  // The default bahaviour. In this example it's checking 
  // using the count property because that is what is returned 
  // from the hook. 
  const count = useCounterStore(
    store => store.counter.count,
    (newStore, currentStore) => newState.counter.count !== oldState.counter.count
  );

  // For hooks returning multiple values as an array, the same check
  // is done for each element if left to the default behaviour.
  const count = useCounterStore(
    store => [store.counter.count, store.counter.isUpdating],
  );

  
  // Only update the local count if the store count is bigger by at least 3.
  const count = useCounterStore(
    store => store.counter.count,
    (newStore) => newStore.counter.count - count > 3
  );

 // Update the local state every time.
  const count = useCounterStore(
    Store => Store.counter.count,
    () => true
  );
}

```
