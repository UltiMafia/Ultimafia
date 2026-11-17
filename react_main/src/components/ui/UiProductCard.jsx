import React from "react";
import UiAction from "./UiAction";
import "./ui.css";

// Products are meaningful selectable objects, not generic page segmentation.
export default function UiProductCard({ title, description, price, ownership, disabled, unavailableLabel, onBuy }) {
  return <article className="ui-card ui-product-card">
    <h3>{title}</h3>
    <p className="ui-product-description">{description}</p>
    <span className="ui-product-ownership">{ownership}</span>
    <div className="ui-product-purchase">
      <strong>{price}</strong>
      <UiAction variant="primary" disabled={disabled} onClick={onBuy} aria-label={`Buy ${title}`}>
        {disabled ? unavailableLabel : "Buy"}
      </UiAction>
    </div>
  </article>;
}
