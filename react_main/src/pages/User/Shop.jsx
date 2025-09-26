import React, { useState, useEffect, useContext } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import update from "immutability-helper";

import { useErrorAlert } from "../../components/Alerts";
import { UserContext, SiteInfoContext } from "../../Contexts";

import {
  Box,
  Grid,
  Button,
  Typography,
  Card,
  CardContent,
  CardActions,
  TextField,
} from "@mui/material";

import "css/shop.css";
import { NewLoading } from "pages/Welcome/NewLoading";

import coin from "images/umcoin.png";

export default function Shop(props) {
  const [shopInfo, setShopInfo] = useState({ shopItems: [], balance: 0 });
  const [loaded, setLoaded] = useState(false);

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();

  useEffect(() => {
    document.title = "Shop | UltiMafia";
  }, []);

  useEffect(() => {
    if (user.loaded && user.loggedIn) {
      axios
        .get("/api/shop/info")
        .then((res) => {
          setShopInfo(res.data);
          setLoaded(true);
        })
        .catch(errorAlert);
    }
  }, [user.loaded]);

  const handleTransferCoins = () => {
    if (!recipient || !amount) {
      siteInfo.showAlert("Please fill out all fields.", "error");
      return;
    }

    const parsedAmount = Number(amount);

    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      siteInfo.showAlert(
        "Please enter a valid positive integer amount.",
        "error"
      );
      return;
    }

    axios
      .post("/api/shop/transferCoins", {
        recipientUsername: recipient,
        amount: parsedAmount,
      })
      .then(() => {
        siteInfo.showAlert("Coins transferred.", "success");
        setRecipient("");
        setAmount("");
      })
      .catch((err) => {
        errorAlert(err);
      });
  };

  function onBuyItem(index) {
    const item = shopInfo.shopItems[index];
    const shouldBuy = window.confirm(
      `Are you sure you wish to buy ${item.name} for ${item.price} coins?`
    );

    if (!shouldBuy) return;

    axios
      .post("/api/shop/spendCoins", { item: index })
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
    <Grid
      item
      xs={12}
      sm={6}
      md={4}
      key={i}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card className="shop-item">
        <CardContent sx={{ textAlign: "left" }}>
          <Typography variant="h4" className="name">
            {item.name}
          </Typography>
          <Typography variant="body2" className="desc">
            {item.desc}
          </Typography>
        </CardContent>
        <CardActions
          className="bottom"
          sx={{ justifyContent: "space-between", textAlign: "left" }}
        >
          <Typography
            variant="body1"
            className="price"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <img
              src={coin}
              style={{ marginRight: "4px", width: "20px", height: "20px" }}
            />{" "}
            {item.price} coins
          </Typography>
          <Typography variant="body1" className="owned">
            Owned: {user.itemsOwned[item.key]}
            {item.limit != null && ` / ${item.limit}`}
          </Typography>
          <Button disabled={item.disabled} onClick={() => onBuyItem(i)}>
            Buy
          </Button>
        </CardActions>
      </Card>
    </Grid>
  ));

  if (user.loaded && !user.loggedIn) return <Navigate to="/play" />;

  if (!loaded) return <NewLoading small />;

  return (
    <Box className="span-panel main shop">
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography
            variant="h3"
            className="balance"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <img
              src={coin}
              style={{ marginRight: "4px", width: "20px", height: "20px" }}
              alt="Coin Icon"
            />
            {shopInfo.balance}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            label="Recipient Username"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <TextField
            label="Amount to Transfer"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button onClick={handleTransferCoins} sx={{ height: "100%" }}>
            Transfer
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} className="shop-items">
        {shopItems}
      </Grid>
    </Box>
  );
}
