"use client";

import { useState } from "react";

export const DemoOutside = () => {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount((c) => c + 1)}>
      You clicked {count} times!
    </button>
  );
};
