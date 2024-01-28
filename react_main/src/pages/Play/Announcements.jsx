// import React, { useContext, useEffect, useState } from "react";
// import { useErrorAlert } from "../../components/Alerts";
// import { UserContext } from "../../Contexts";
// import { getPageNavFilterArg, PageNav } from "../../components/Nav";
// import axios from "axios";
// import { AnnouncementItem } from "./AnnouncementItem";
// import { Card } from "@mui/material";
//
// export const Announcements = () => {
//   const [page, setPage] = useState(1);
//   const [announcements, setAnnouncements] = useState([]);
//
//   const errorAlert = useErrorAlert();
//   const user = useContext(UserContext);
//
//   useEffect(() => {
//     onPageNav(1);
//   }, []);
//
//   function onPageNav(_page) {
//     var filterArg = getPageNavFilterArg(_page, page, announcements, "date");
//
//     if (filterArg == null) return;
//
//     axios
//       .get(`/mod/announcements?${filterArg}`)
//       .then((res) => {
//         if (res.data.length > 0) {
//           setAnnouncements(res.data);
//           setPage(_page);
//         }
//       })
//       .catch(errorAlert);
//   }
//
//   const announcementRows = announcements.map((announcement) => (
//     <AnnouncementItem
//       announcement={announcement}
//       userSettings={user.settings}
//     />
//   ));
//
//   return (
//     <Card
//       sx={{
//         display: "flex",
//         flexDirection: "column",
//         p: 1,
//         mt: 12,
//       }}
//     >
//       <div style={{ fontWeight: "bold" }}>Announcements</div>
//       <PageNav page={page} onNav={onPageNav} />
//       {announcementRows}
//       <PageNav page={page} onNav={onPageNav} />
//     </Card>
//   );
// };
