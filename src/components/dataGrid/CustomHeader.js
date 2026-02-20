import React from "react";
import {
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { Toolbar, ToolbarButton } from "@mui/x-data-grid";
import { Settings } from "@mui/icons-material";
import CheckIcon from "@mui/icons-material/Check";

const DENSITY_OPTIONS = [
  { value: "compact", label: "Compact" },
  { value: "standard", label: "Standard" },
  { value: "comfortable", label: "Comfortable" },
];

export default function CustomHeader({
  densityMenuTriggerRef,
  densityMenuOpen,
  setDensityMenuOpen,
  density,
  setDensity,
}) {
  return (
    <Toolbar>
      <Tooltip title="Settings">
        <ToolbarButton
          ref={densityMenuTriggerRef}
          id="density-menu-trigger"
          aria-controls="density-menu"
          aria-haspopup="true"
          aria-expanded={densityMenuOpen ? "true" : undefined}
          onClick={() => setDensityMenuOpen(true)}
        >
          <Settings fontSize="small" sx={{ ml: "auto" }} />
        </ToolbarButton>
      </Tooltip>

      <Menu
        id="density-menu"
        anchorEl={densityMenuTriggerRef.current}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        open={densityMenuOpen}
        onClose={() => setDensityMenuOpen(false)}
        slotProps={{
          list: {
            "aria-labelledby": "density-menu-trigger",
          },
        }}
      >
        {DENSITY_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => {
              setDensity(option.value);
              setDensityMenuOpen(false);
            }}
          >
            <ListItemIcon>
              {density === option.value && <CheckIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>{option.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Toolbar>
  );
}
