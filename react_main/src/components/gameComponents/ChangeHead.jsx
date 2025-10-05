import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";

export default function ChangeHead({ title, duration }) {
  const [alive, setAlive] = useState(true);

  useEffect(() => {
    setAlive(true);

    if (duration) {
      const timeout = setTimeout(() => {
        setAlive(false);
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [title]);

  if (!alive) {
    return null;
  }

  return (
    <Helmet defer={false}>
      <title>{title}</title>
      <meta name="description" content={`Testing embed: ${title}`} />
    </Helmet>
  );
};
