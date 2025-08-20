import ReactMarkdown from "react-markdown";

import { emotify } from "components/Emotes";
import { MediaEmbed } from "pages/User/User";

export default function CustomMarkdown(props) {
  return (
    <ReactMarkdown
      components={{
        a(properties) {
          const { node, ...rest } = properties;
          return (
            <a
              href={properties.href}
              rel="noopener noreferrer nofollow"
              {...rest}
            >
              {properties.children}
            </a>
          );
        },
        img(properties) {
          return <MediaEmbed mediaUrl={properties.src} />;
        },
        p(properties) {
          const { node, ...rest } = properties;
          return <p {...rest}>{emotify(properties.children)}</p>;
        },
      }}
    >
      {props.children}
    </ReactMarkdown>
  );
}
