# [Barebone](src/barebone)
Simple and easy to use React state management using hooks and typing for TS.

### [Demo](https://seegg.github.io/barebone-demo/) 
using a simple counter shared between sibling components.

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
  actions: {
    [key: string]: (state: State, ...args: unknown[]) => State
    };
  /** 
   * Async actions. New states are passed to setState instead of being 
   * returned.
  */
  asyncActions: {
    [key: string]: (
      setState: (state: State) => void,
      state: State,
      ...args: unknown[]
    ) => Promise<Void>;
  };
}
```
## Actions
After creating the store, the state values can be accessed through 
`store.<name>` 

When defining `actions` the first param is the state, any additional
params can be included for passing in additional data when the `action`
is called. After the store is created the default state param on an `action` 
is hidden and only the user defined params will be exposed.

When updating a state, a new state must be returned instead of mutating
the existing one.

If an action depends on the result of another action, instead of using
one action inside of another it should be compose together in an outside
function. This is the same for async actions.


```ts
import {createStore} from 'barebone'

// Optional step if you want to explicitly assign a type to the state.
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

Unsurprisingly async actions are added under the `asyncActions` option 
when creating the store. While new states are returned in synchronous 
actions, for async actions new states are pass to a helper function which 
is available as the first param while defining the action. The store
state is made available as the second param. Like synchronous actions
these default params are also hidden after store creation.

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
accepts a select function that has the store as the first param. the
`select` function can be use to narrow down the return value for the 
hook.

Actions are not restricted to react components and can be use anywhere.

To access the store outside of a react component, the `store` property
is made available for this purpose.

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

The check is done during store updates. The new store state and the current
store state is pass into the function as the first and second argument.

If this function isn't defined, the default behaviour for the check is to do
a strict comparison `===` between the old state and the new state using the
same property as the one returned from `useStore`.

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
