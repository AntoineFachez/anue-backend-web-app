"use client";

import React, { useRef, useState } from "react";
import { Box, useTheme, IconButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import CustomHeader from "./CustomHeader";
import CustomFooter from "./CustomFooter";

export default function CustomDataGrid({
  rows,
  columns,
  columnVisibilityModel,
  onColumnVisibilityModelChange,
  onColumnResize,
  // Isolate selection props
  rowSelectionModel,
  onRowSelectionModelChange,
  ...props
}) {
  const theme = useTheme();
  const [density, setDensity] = useState("compact");
  const [expandedRows, setExpandedRows] = useState([]);

  const [descColumnWidth, setDescColumnWidth] = useState(null);

  const handleToggleExpand = (rowId) => {
    setExpandedRows((prev) => {
      const isCurrentlyExpanded = prev.includes(rowId);
      const newExpandedRows = isCurrentlyExpanded
        ? prev.filter((id) => id !== rowId)
        : [...prev, rowId];

      if (typeof window !== "undefined") {
        try {
          const defaultWidth = 400; // Original default width
          let userWidth = null;

          const savedState = localStorage.getItem("datagrid-column-visibility");
          if (savedState) {
            const parsed = JSON.parse(savedState);
            if (parsed.widths && parsed.widths.description) {
              userWidth = parsed.widths.description;
            }
          }

          if (newExpandedRows.length > 0) {
            setDescColumnWidth(defaultWidth);
          } else {
            setDescColumnWidth(userWidth || null);
          }
        } catch (e) {
          console.error("Failed to parse datagrid-column-visibility", e);
        }
      }

      return newExpandedRows;
    });
  };

  const processedColumns = React.useMemo(() => {
    if (!columns) return [];
    return columns.map((col) => {
      if (col.field === "description") {
        return {
          ...col,
          ...(descColumnWidth !== null ? { width: descColumnWidth } : {}),
          renderCell: (params) => {
            const isExpanded = expandedRows.includes(params.id);
            return (
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                }}
              >
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleExpand(params.id);
                  }}
                  sx={{
                    // position: "absolute",
                    // top: 0,
                    // left: 0,
                    // mr: 1,
                    // mt: -0.5,
                    color: "primary.main",
                    "&:hover": {
                      color: "white",
                      bgcolor: "primary.main",
                    },
                  }}
                >
                  {isExpanded ? (
                    <ExpandLessIcon fontSize="small" />
                  ) : (
                    <ExpandMoreIcon fontSize="small" />
                  )}
                </IconButton>
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "flex-start",
                    alignContent: "center",
                    ml: "2rem",
                    // textIndent: "2rem",
                  }}
                >
                  {params.value}
                </Box>
              </Box>
            );
          },
        };
      }
      return col;
    });
  }, [columns, expandedRows, descColumnWidth]);

  if (!rows || rows.length === 0 || !columns || columns.length === 0)
    return null;

  const borderColor = theme.palette.mode === "dark" ? "#555555ff" : "#595959ff";

  return (
    <Box
      sx={{
        flexGrow: 1,
        width: "100%",
        overflow: "hidden",
        pb: "5rem",
      }}
    >
      <DataGrid
        rows={rows}
        columns={processedColumns}
        getRowId={(row) => String(row.id)}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        initialState={{
          pagination: { paginationModel: { pageSize: 50 } },
        }}
        density={density}
        onDensityChange={(newDensity) => setDensity(newDensity)}
        getRowHeight={(params) =>
          expandedRows.includes(params.id)
            ? "auto"
            : density === "compact"
              ? 30
              : 50
        }
        // 2. Provide an estimate for the virtual scroller performance
        getEstimatedRowHeight={() => 10}
        getRowClassName={(params) => {
          let classes = [];
          if (expandedRows.includes(params.id)) classes.push("expanded-row");
          if (params.row.error) classes.push("error-row");
          return classes.join(" ");
        }}
        checkboxSelection
        disableRowSelectionOnClick
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={onColumnVisibilityModelChange}
        onColumnResize={onColumnResize}
        // Explicitly pass selection props with fallback
        // rowSelectionModel={rowSelectionModel || []}
        onRowSelectionModelChange={onRowSelectionModelChange}
        slots={{
          // toolbar: CustomHeader,
          footer: CustomFooter,
        }}
        // slotProps={{
        //   toolbar: {
        //     densityMenuTriggerRef,
        //     densityMenuOpen,
        //     setDensityMenuOpen,
        //     density,
        //     setDensity,
        //   },
        // }}
        sx={{
          bgcolor: theme.palette.background.paper,
          "& .MuiDataGrid-cell": {
            color: "text.primary",
          },
          "& .MuiDataGrid-cell[data-field='description']": {
            display: "-webkit-box",
            alignItems: "flex-start",
            // py: 1,
            wordWrap: "break-word",
            whiteSpace: "normal",
            WebkitLineClamp: 3, // clamp to 3 lines when collapsed
            WebkitBoxOrient: "vertical",
            padding: 0,
            overflow: "hidden", // Hide overflow normally
          },
          "& .expanded-row .MuiDataGrid-cell[data-field='description']": {
            display: "block",
            maxHeight: "none",
            overflow: "visible",
          },
          "& .error-row": {
            backgroundColor: "rgba(211, 47, 47, 0.15)",
            "&:hover": {
              backgroundColor: "rgba(211, 47, 47, 0.25)",
            },
          },

          "& .MuiDataGrid-iconButtonContainer .MuiSvgIcon-root": {
            color: "white",
            fill: "white",
            bgcolor: "primary.main",
            borderRadius: "50%",
          },
          "& .MuiDataGrid-menuIcon .MuiSvgIcon-root": {
            color: "white",
            fill: "white",
            bgcolor: "primary.main",
            borderRadius: "50%",
          },

          "& .MuiDataGrid-columnSeparator": {
            visibility: "visible",
            color: borderColor,
          },
          "& .MuiDataGrid-columnSeparator": {
            color: borderColor,
            visibility: "visible",

            "&:hover": {
              color: "white",
            },

            "& .MuiSvgIcon-root": {
              fill: "currentColor",
              transition: "color 0.2s ease",
            },
          },

          "& .MuiDataGrid-cell--typeBoolean": {
            "& svg[data-testid='CheckIcon']": {
              fill: "green",
              color: "green",
            },
            "& svg[data-testid='CloseIcon']": {
              fill: "red",
              color: "red",
            },
          },

          // 3. STYLE THE CHECKBOXES (Selection Column)
          "& .MuiCheckbox-root": {
            color: borderColor,
            "&.Mui-checked": {
              color: "steelblue",
            },
          },

          // Make Checkbox Column Sticky
          // "& .MuiDataGrid-columnHeader--checkbox, & .MuiDataGrid-cell--checkbox":
          //   {
          //     position: "sticky",
          //     left: 0,
          //     zIndex: 1,
          //     backgroundColor: theme.palette.background.paper,
          //   },
          // "& .MuiDataGrid-columnHeader--checkbox": {
          //   zIndex: 2,
          // },
          "& .MuiCheckbox-root": {
            zIndex: 2,
            color: borderColor,
          },

          "& .Mui-checked": {
            zIndex: 2,
            color: "steelblue",
          },
          "--DataGrid-rowBorderColor": borderColor,
        }}
        // showToolbar
        {...props}
      />
    </Box>
  );
}
