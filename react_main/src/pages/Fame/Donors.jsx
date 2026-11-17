import React from "react";
import AcknowledgementDirectory from "components/AcknowledgementDirectory";

export default function Donors() {
  return <AcknowledgementDirectory kind="donor" title="Donors">
    <p>This page thanks the people who have financially supported UltiMafia. If you donated and are not listed, please contact an admin.</p>
    <p>UltiMafia is not for profit and is hosted primarily through donations. You can donate on <a href="https://ko-fi.com/ultimafia" target="_blank" rel="noopener noreferrer">Ko-Fi</a> for a Donor profile badge and a place on this page.</p>
  </AcknowledgementDirectory>;
}
