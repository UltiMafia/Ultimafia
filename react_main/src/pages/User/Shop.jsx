import React, { useState, useEffect, useContext, useRef } from "react";
import { Redirect } from "react-router-dom";
import axios from "axios";
import update from "immutability-helper";

import LoadingPage from "../Loading";
import { useErrorAlert } from "../../components/Alerts";
import { UserContext, SiteInfoContext } from "../../Contexts";

import "../../css/shop.css";

export default function Shop(props) {
  const [shopInfo, setShopInfo] = useState({ shopItems: [], balance: 0 });
  const [loaded, setLoaded] = useState(false);

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  useEffect(() => {
    document.title = "Shop | BeyondMafia";
  }, []);

  useEffect(() => {
    if (!user.loaded || !user.loggedIn) return;

    axios
      .get("/shop/info")
      .then((res) => {
        setShopInfo(res.data);
        setLoaded(true);
      })
      .catch(errorAlert);
  }, [user.loaded]);

  function onBuyItem(index) {
    const item = shopInfo.shopItems[index];
    const shouldBuy = window.confirm(
      `Are you sure you wish to buy ${item.name} for ${item.price} coins?`
    );

    if (!shouldBuy) return;

    axios
      .post("/shop/spendCoins", { item: index })
      .then(() => {
        siteInfo.showAlert("Item purchased.", "success");

        setShopInfo(
          update(shopInfo, {
            balance: {
              $set: shopInfo.balance - item.price,
            },
          })
        );

        let itemsOwnedChanges = {
          [item.key]: {
            $set: user.itemsOwned[item.key] + 1,
          },
        };

        // propagate other item updates
        for (let k in item.propagateItemUpdates) {
          let change = item.propagateItemUpdates[k];
          itemsOwnedChanges[k] = {
            $set: user.itemsOwned[k] + change,
          };
        }

        user.set(
          update(user.state, {
            itemsOwned: itemsOwnedChanges,
          })
        );
      })
      .catch(errorAlert);
  }

  const shopItems = shopInfo.shopItems.map((item, i) => (
    <div className="shop-item" key={i}>
      <div className="name">{item.name}</div>
      <div className="desc">{item.desc}</div>
      <div className="bottom">
        <div className="price">
          <i className="fas fa-coins" />
          {item.price} coins
        </div>
        <div className="owned">
          Owned:
          <div className="amt">
            {user.itemsOwned[item.key]}
            {item.limit != null && ` / ${item.limit}`}
          </div>
        </div>
        <div
          className={`buy btn btn-theme`}
          disabled={item.disabled}
          onClick={() => onBuyItem(i)}
        >
          Buy
        </div>
      </div>
    </div>
  ));

  if (user.loaded && !user.loggedIn) return <Redirect to="/play" />;

  if (!loaded) return <LoadingPage />;

  return (
    <div className="span-panel main shop">
      <div className="top-bar">
        <div className="balance">
          <i className="fas fa-coins" />
          {shopInfo.balance}
        </div>
      </div>
      <div className="shop-items">{shopItems}</div>
    </div>
  );
}
