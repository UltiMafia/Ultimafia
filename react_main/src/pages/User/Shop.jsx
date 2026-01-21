import React, { useState, useEffect, useContext } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import update from "immutability-helper";

import { useErrorAlert } from "../../components/Alerts";
import { UserContext, SiteInfoContext } from "../../Contexts";

import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  TextField,
  Stack,
  Paper,
  Grid2,
  CardActionArea,
  Divider,
} from "@mui/material";

import { Loading } from "../../components/Loading";

import coin from "images/umcoin.png";
import { useIsPhoneDevice } from "hooks/useIsPhoneDevice";

export default function Shop(props) {
  const [shopInfo, setShopInfo] = useState({ shopItems: [], balance: 0 });
  const [loaded, setLoaded] = useState(false);

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const user = useContext(UserContext);
  const siteInfo = useContext(SiteInfoContext);
  const errorAlert = useErrorAlert();
  const isPhoneDevice = useIsPhoneDevice();

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

  const shopItems = shopInfo.shopItems.map((item, i) => {
    const numOwned = user.itemsOwned[item.key] || 0;
    const disabled = item.disabled || numOwned === item.limit;

    const price = (
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography>{item.price}</Typography>
        <img src={coin} style={{ width: "20px", height: "20px" }} />
      </Stack>
    );

    return (
      <Grid2
        size={{
          xs: 12,
          sm: 6,
          md: 3,
        }}
        key={i}
      >
        <Card
          variant="outlined"
          sx={{
            height: "100%",
            width: "100%",
            opacity: disabled ? "50%" : undefined,
            minHeight: isPhoneDevice ? undefined : "15em",
          }}
        >
          <CardActionArea
            disabled={disabled}
            onClick={() => onBuyItem(i)}
            sx={{
              height: "100%",
              width: "100%",
            }}
          >
            <CardContent
              sx={{
                height: "100%",
                width: "100%",
              }}
            >
              <Stack
                direction={isPhoneDevice ? "row" : "column"}
                spacing={1}
                sx={{
                  height: "100%",
                  width: "100%",
                }}
              >
                <Stack
                  direction="column"
                  spacing={1}
                  sx={{
                    height: "100%",
                    flex: "1",
                    marginBottom: isPhoneDevice ? undefined : 1,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography
                      variant="h3"
                      sx={{ flex: isPhoneDevice ? "1" : undefined }}
                    >
                      {item.name}
                    </Typography>
                    {isPhoneDevice && price}
                  </Stack>
                  <Typography variant="caption">
                    Owned: {user.itemsOwned[item.key] || 0}
                    {item.limit != null && ` / ${item.limit}`}
                  </Typography>
                  <Paper
                    sx={{
                      p: 1,
                      flex: isPhoneDevice ? undefined : "1",
                    }}
                  >
                    <Typography variant="body2">{item.desc}</Typography>
                  </Paper>
                </Stack>
                {!isPhoneDevice && <Box sx={{ pt: 1 }}>{price}</Box>}
              </Stack>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid2>
    );
  });

  if (user.loaded && !user.loggedIn) return <Navigate to="/play" />;

  if (!loaded) return <Loading small />;

  return (
    <Stack direction="column" spacing={1}>
      <Paper sx={{ p: 2 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            justifyContent: "center",
          }}
        >
          <Typography variant="h3" className="balance">
            You have: {shopInfo.balance}
          </Typography>
          <img
            className="um-coin"
            src={coin}
            style={{ width: "20px", height: "20px" }}
            alt="Coin Icon"
          />
        </Stack>
      </Paper>

      <Divider flexItem orientation="horizontal" />

      <Grid2 container spacing={1}>
        {shopItems}
      </Grid2>

      <Divider flexItem orientation="horizontal" />

      <Paper sx={{ p: 2 }}>
        <Stack
          direction={isPhoneDevice ? "column" : "row"}
          spacing={1}
          sx={{
            alignItems: isPhoneDevice ? "stretch" : "center",
            width: "100%",
          }}
        >
          <Typography variant="h3">Transfer coins</Typography>
          <Divider
            flexItem
            orientation={isPhoneDevice ? "horizontal" : "vertical"}
          />
          <TextField
            label="Recipient Username"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            sx={{
              flex: "1",
            }}
          />
          <TextField
            label="Amount to Transfer"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            sx={{
              flex: "1",
            }}
          />
          <Button
            onClick={handleTransferCoins}
            sx={{
              alignSelf: "stretch",
            }}
          >
            Transfer
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
