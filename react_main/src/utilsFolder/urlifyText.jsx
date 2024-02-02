import React from "react";

export const urlifyText = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const result = text.split(urlRegex).map((chunk) => {
    if (chunk.match(urlRegex)) {
      return (
        <a
          target="_blank"
          href={chunk}
          style={{ color: "inherit" }}
          rel="noopener noreferrer nofollow"
        >
          {chunk}
        </a>
      );
    }

    // const chunkStartsWithSpace = chunk.startsWith(" ");
    // const chunkEndsWithSpace = chunk.endsWith(" ");
    // let chunkPadded = chunk.slice(
    //   0 + Number(chunkStartsWithSpace),
    //   chunk.length - Number(chunkEndsWithSpace)
    // );

    return (
      <span>
        {chunk}
        {/*{chunkStartsWithSpace && <>&nbsp;</>}*/}
        {/*{chunkPadded}*/}
        {/*{chunkEndsWithSpace && <>&nbsp;</>}*/}
      </span>
    );
  });

  return result;
};
