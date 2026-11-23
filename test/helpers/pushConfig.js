// Public, test-only VAPID fixture. Preload in Mocha's main process and every
// parallel worker: a reused worker may load Game (and cache pushNotifications)
// before it reaches a push test file. Per-file env setup is then too late.
process.env.VAPID_PUBLIC_KEY =
  "BBox3iOPqgDEx62MhFTmrv8YEBVACSVMdKTjIwIQpRoQ387eBHk0gBp2g3dav4kfPn7g1wLiburjIQh_L93629I";
process.env.VAPID_PRIVATE_KEY = "Nvv9yUKgO324l32336ogfzhJftPLex7XVs-2ZTfiti8";
process.env.VAPID_SUBJECT = "mailto:test@ultimafia.com";
