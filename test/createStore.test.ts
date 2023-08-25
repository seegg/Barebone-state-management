/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { createStore } from '../src/barebone';

describe('createStore()', () => {
  // Default values for setting up the tests.
  interface TestCounter {
    value: number;
    isUpdating: boolean;
  }

  const initialState: TestCounter = {
    value: 0,
    isUpdating: false,
  };

  const name = 'test';

  describe('useStore()', () => {
    const { useStore, actions, store } = createStore({
      name,
      initialState,
      actions: {
        increment: (state) => ({ ...state, value: state.value + 1 }),
        setCounterValue: (state, value: number) => ({ ...state, value }),
      },
    });

    it('Selects the correct properties from the store', () => {
      const expected = store.test.value;

      const { result } = renderHook(() =>
        useStore((store) => store.test.value),
      );
      expect(result.current).toEqual(expected);
    });

    it('Receives updates from the store', () => {
      const oldValue = store.test.value;

      const hookResult = renderHook(() =>
        useStore((store) => store.test.value),
      );

      // Update the store by calling an action. and see
      // that the value from the hook is updated as well.
      act(() => actions.increment());
      const currentValue = store.test.value;

      expect(hookResult.result.current).not.toEqual(oldValue);
      expect(hookResult.result.current).toEqual(currentValue);
    });

    it('Should not update local state unless equality check passes', () => {
      const oldValue = store.test.value;

      const { result } = renderHook(() => {
        return useStore(
          (store) => store.test.value,
          // Limit updates to values that are a multiple of 5.
          (newStore) => newStore.test.value % 5 === 0,
        );
      });

      // Set a value that fails the check.
      act(() => actions.setCounterValue(3));

      expect(result.current).not.toEqual(store.test.value);
      expect(result.current).toEqual(oldValue);

      // Set a value that passes the check.
      act(() => actions.setCounterValue(15));
      expect(result.current).toEqual(store.test.value);
    });

    it(`Removes listener from the store when component unmounts.`, () => {
      const mockCheckFn = jest.fn().mockResolvedValue(true);

      const hookResult = renderHook(() =>
        useStore((store) => store.test.value, mockCheckFn),
      );

      expect(mockCheckFn).toBeCalledTimes(0);

      // The check function shouldn't be called again after
      // its component has unmounted.
      act(() => actions.increment());
      expect(mockCheckFn).toBeCalledTimes(1);
      hookResult.unmount();

      act(() => actions.increment());
      expect(mockCheckFn).toBeCalledTimes(1);
    });
  });

  // Actions.

  describe('synchronous actions', () => {
    const { useStore, actions, store } = createStore({
      name,
      initialState,
      actions: {
        increment: (state) => ({ ...state, value: state.value + 1 }),
        setCounterValue: (state, value: number) => ({ ...state, value }),
      },
    });

    it('Should update the store when called', () => {
      const oldValue = store.test.value;
      actions.increment();
      expect(store.test.value).toEqual(oldValue + 1);

      const valueToBeSet = store.test.value + 100000;
      actions.setCounterValue(valueToBeSet);
      expect(store.test.value).toEqual(valueToBeSet);
    });

    it('Triggers updates on all hooks connected to the store', () => {
      const oldValue = store.test.value;

      const hook1 = renderHook(() => useStore((store) => store));
      const hook2 = renderHook(() => useStore((store) => store));
      const hook3 = renderHook(() => useStore((store) => store));

      [hook1, hook2, hook3].forEach(({ result: { current } }) => {
        expect(current.test.value).toEqual(oldValue);
      });

      const newValue = oldValue + 10;
      act(() => {
        actions.setCounterValue(newValue);
      });
      [hook1, hook2, hook3].forEach(({ result: { current } }) => {
        expect(current.test.value).toEqual(newValue);
      });
    });
  });

  // Asynchronous actions.

  describe('async actions', () => {
    const { useStore, asyncActions, store } = createStore({
      name,
      initialState,
      asyncActions: {
        setCounterValueAsync: async (state, value: number) => {
          const result = await Promise.resolve(value);
          return { ...state, value: result };
        },
      },
    });

    it('Should update the store when called', async () => {
      const valueToBeSet = store.test.value + 100000;
      asyncActions.setCounterValueAsync(valueToBeSet);
      await waitFor(() => expect(store.test.value).toEqual(valueToBeSet));
    });

    it('Triggers updates on all hooks connected to the store', async () => {
      const oldValue = store.test.value;

      const hook1 = renderHook(() => useStore((store) => store));
      const hook2 = renderHook(() => useStore((store) => store));
      const hook3 = renderHook(() => useStore((store) => store));

      [hook1, hook2, hook3].forEach(({ result: { current } }) => {
        expect(current.test.value).toEqual(oldValue);
      });

      const newValue = oldValue + 10;
      const assertions: Promise<void>[] = [];
      await act(() => asyncActions.setCounterValueAsync(newValue));
      [hook1, hook2, hook3].forEach(({ result: { current } }) => {
        assertions.push(
          waitFor(() => expect(current.test.value).toEqual(newValue)),
        );
      });
      await Promise.all(assertions);
    });
  });
});
