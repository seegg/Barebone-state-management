# [Barebone](src/barebone)
Simple React state management using hooks and typing for TS.

[Demo](https://seegg.github.io/barebone-demo/) using
a simple counter shared between sibling components.

## Creating the store
The `createStore` function returns an object containing all the items needed
for accessing and manipulating the state that was pass to it.

To use types with TS, just defined them as needed when creating the store.

```ts
const {useStore, actions, asyncActions, store} = createStore({...storeOptions});
```

`createStore` accepts a `storeOptions` object:

```ts
// storeOptions:
{
  /**
   * Name associated with the store. The state values are access through
   * a property that is the same as this value. 
  */
  name: string;
  /** The initial state, it can be any value. */
  initialState: State;
  /** Synchronous actions. Must return a new state.*/
  actions: (state: State, ...args: unknown[]) => State
  /** 
   * Async actions. New states are passed to setState instead of being 
   * returned.
  */
  asyncActions: (
    setState: (state: State) => State, 
    state: State, 
    ...args: unknown[]
    ) => Promise<State>
}1
```

After creating the store, the state values can be accessed through 
`store.<name>` 

When defining `actions` the first param is the state, any additional
param can be included for passing in additional data when the `action`
is called. After the store is created the default params are hidden and only 
the user defined ones will be exposed. See the next section for `async actions`.

When updating a state, a new state must be returned instead of mutating
the existing one.


```ts
import {createStore} from 'barebone'

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
be pass to `setState` when updating the store.


```ts
import {createStore} from 'barebone'

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

To access the store outside of components, it can be access through the
`store` property after creating the store.

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
state should be updated when the store is updated. This can be use to avoid 
unnecessary rerenders.

The check is done when the store is updating. The new store state and
the current state is pass into the function as the first and second argument.
It returns a boolean indicating whether the local state should be
updated or not.

If no function is defined, the default behaviour for the check is to do
a strict comparison `===` between the old state and the new state using the
same property as the one returned from `useStore`.

```ts
const Counter = () => {
  // Default bahaviour
  const count = useCounterStore(
    store => store.counter.count,
    (newStore, currentStore) => newState.counter.count !== oldState.counter.count
  );
  
  // Only update the local count if the store count is bigger by at least 3.
  const count = useCounterStore(
    store => store.counter.count,
    (newStore) => newStore.counter.count - count > 3
  );

 // Update the local state any time the store updates.
  const count = useCounterStore(
    Store => Store.counter.count,
    () => true
  );
}

```
