import React from 'react';

export const TestReact = () => {
  const [count, setCount] = React.useState(0);
  
  return (
    <div>
      <h1>Test React: {count}</h1>
      <button onClick={() => setCount(count + 1)}>Incrementar</button>
    </div>
  );
};
