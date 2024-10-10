import React, { useState, useEffect, useContext } from "react";
import { Redirect } from "react-router-dom";
import axios from "axios";
import update from "immutability-helper";

import { useErrorAlert } from "../../components/Alerts";
import { UserContext, SiteInfoContext } from "../../Contexts";

import "../../css/shop.css";
import { NewLoading } from "../Welcome/NewLoading";

const coin = `/images/umcoin.png`;

// Material UI Imports
import {
  Box,
  Grid,
  Button,
  Typography,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";

export default function Shop(props) {
  const [shopInfo, setShopInfo] = useState({ shopItems: [], balance: 0 });
  const [loaded, setLoaded] = useState(false);

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  useEffect(() => {
    document.title = "Shop | UltiMafia";
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
    <Grid item xs={12} sm={6} md={4} key={i}>
      <Card className="shop-item">
        <CardContent sx={{ textAlign: 'left' }}> {/* Left-align item content */}
          <Typography variant="h6" className="name">
            {item.name}
          </Typography>
          <Typography variant="body2" className="desc">
            {item.desc}
          </Typography>
        </CardContent>
        <CardActions
          className="bottom"
          sx={{ justifyContent: "space-between", textAlign: 'left' }}
        >
          <Typography variant="body1" className="price" sx={{ display: 'flex', alignItems: 'center' }}>
            <img src={coin} style={{ marginRight: '4px', width: '20px', height: '20px' }} /> {/* Reduce gap */}
            {item.price} coins
          </Typography>
          <Typography variant="body1" className="owned">
            Owned: {user.itemsOwned[item.key]}
            {item.limit != null && ` / ${item.limit}`}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            disabled={item.disabled}
            onClick={() => onBuyItem(i)}
            sx={{ textTransform: "none" }}
          >
            Buy
          </Button>
        </CardActions>
      </Card>
    </Grid>
  ));

  if (user.loaded && !user.loggedIn) return <Redirect to="/play" />;

  if (!loaded) return <NewLoading small />;

  return (
    <Box className="span-panel main shop">
      <Box
        className="bot-bar"
        sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }} // Left-align balance
      >
        <Typography variant="h6" className="balance" sx={{ display: 'flex', alignItems: 'center' }}>
          <img src={coin} style={{ marginRight: '4px', width: '20px', height: '20px' }} /> {/* Adjusted coin size */}
          {shopInfo.balance}
        </Typography>
      </Box>
      <Grid container spacing={2} className="shop-items">
        {shopItems}
      </Grid>
    </Box>
  );
}
