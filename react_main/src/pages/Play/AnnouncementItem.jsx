// import { NameWithAvatar } from "../User/User";
// import { Time, UserText } from "../../components/Basic";
// import React from "react";
// import { Card, ThemeProvider } from "@mui/material";
// import { useTheme } from "@mui/material/styles";
//
// export const AnnouncementItem = ({
//   announcement: { id, date, content, mod },
//   userSettings,
// }) => {
//   const theme = useTheme();
//
//   return (
//     <ThemeProvider theme={theme}>
//       <Card
//         key={id}
//         sx={{
//           p: 1,
//           mb: 1,
//           background: theme.palette.infoDarker,
//         }}
//       >
//         <div style={{ display: "flex", alignItems: "center" }}>
//           <NameWithAvatar id={mod?.id} name={mod?.name} avatar={mod?.avatar} />
//           <div style={{ marginLeft: "10px", opacity: 0.69 }}>
//             <Time minSec millisec={Date.now() - date} suffix=" ago" />
//           </div>
//         </div>
//         <div style={{ wordBreak: "break-word" }}>
//           <UserText
//             text={content}
//             settings={userSettings}
//             filterProfanity
//             linkify
//             emotify
//           />
//         </div>
//       </Card>
//     </ThemeProvider>
//   );
// };
