import React, { useEffect, useState } from "react";
import { graphql } from "@octokit/graphql";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Link,
  Chip,
  CircularProgress,
} from "@mui/material";

export default function Roadmap() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Roadmap | UltiMafia";

    const fetchIssues = async () => {
      try {
        const token = process.env.REACT_APP_GITHUB_PAT;

        const { repository } = await graphql(
          `
            {
              repository(owner: "UltiMafia", name: "Ultimafia") {
                issues(first: 100, states: [OPEN]) {
                  edges {
                    node {
                      id
                      title
                      state
                      url
                      createdAt
                      labels(first: 5) {
                        nodes {
                          id
                          name
                        }
                      }
                    }
                  }
                }
              }
            }
          `,
          {
            headers: {
              authorization: `token ${token}`,
            },
          }
        );

        const sortedIssues = repository.issues.edges
          .map((edge) => edge.node)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setIssues(sortedIssues);
      } catch (error) {
        console.error("Error fetching GitHub issues:", error);
      }
      setLoading(false);
    };

    fetchIssues();
  }, []);

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Development Roadmap
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Issue</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Labels</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell>
                    <Link
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {issue.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={issue.state}
                      color={issue.state === "OPEN" ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell>
                    {issue.labels.nodes.map((label) => (
                      <Chip
                        key={label.id}
                        label={label.name}
                        sx={{ marginRight: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell>
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}
