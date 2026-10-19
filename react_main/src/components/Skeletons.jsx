import React from "react";
import { Skeleton, Stack } from "@mui/material";

// Placeholder shapes for content that is still loading. They keep the layout
// stable and read as "this is coming" rather than a spinner that replaces the
// page.

export function ListSkeleton({ rows = 5, height = 72 }) {
  return (
    <Stack spacing={1} sx={{ width: "100%" }}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} variant="rounded" height={height} />
      ))}
    </Stack>
  );
}

export function PageSkeleton({ rows = 6, headerWidth = "40%" }) {
  return (
    <Stack spacing={1.5} sx={{ width: "100%" }}>
      <Skeleton variant="text" width={headerWidth} height={40} />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} variant="rounded" height={56} />
      ))}
    </Stack>
  );
}

export function ProfileSkeleton() {
  return (
    <Stack spacing={2} sx={{ alignItems: "center", py: 4, width: "100%" }}>
      <Skeleton variant="circular" width={96} height={96} />
      <Skeleton variant="text" width={160} height={32} />
      <Skeleton variant="rounded" width="100%" height={140} />
    </Stack>
  );
}

export function ThreadSkeleton({ replies = 4 }) {
  return (
    <Stack spacing={2} sx={{ width: "100%" }}>
      <Skeleton variant="rounded" height={80} />
      {Array.from({ length: replies }).map((_, index) => (
        <Skeleton key={index} variant="rounded" height={64} />
      ))}
    </Stack>
  );
}
