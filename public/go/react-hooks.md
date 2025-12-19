# React Hooks Guide

Hooks are a new addition in React 16.8. They let you use state and other React features without writing a class.

## useState

```javascript
const [count, setCount] = useState(0);
```

## useEffect

```javascript
useEffect(() => {
  document.title = `You clicked ${count} times`;
});
```
