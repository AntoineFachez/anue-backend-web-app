// file path: ~/DEVFOLD/ANUE-BACKEND/SRC/BODY/BODY.JS

"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Divider,
} from "@mui/material"; // ✅ ADDED: CircularProgress

import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

import AppBar from "@/components/appBar/index";
import CustomBottomNav from "@/components/bottomBar/BottomBar";
import LoginForm from "@/widgets/appAuth/LogInForm";
import SideNavBar from "@/components/sideBar/SideBar";
import SignUpForm from "@/widgets/appAuth/SignUpForm";

import { useUi } from "@/context/UiContext";

import CircularIndeterminate from "@/components/progress/CircularIndeterminate";

import { darkTheme } from "@/theme/theme";
export default function Body({ children }) {
  const { appContext } = useApp();
  const { firebaseUser, isUserLoading } = useAuth();
  const { currentWindowSize, isDesktop, isMobile } = useUi();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const NAV_HEIGHT = isMobile ? "48px" : "48px"; // Typical MUI AppBar height on desktop
  const SIDEBAR_WIDTH = isDesktop ? "72px" : 0; // Typical MUI AppBar height on desktop
  const BOTTOM_NAV_HEIGHT = isDesktop ? 0 : "56px"; // Typical MUI BottomNavigation height

  const toggleAuthMode = () => {
    setIsSigningUp((prev) => !prev);
  };

  // 1. Show a loading spinner while the NextAuth session status is resolving.
  // This is CRITICAL for a smooth UX and preventing a flicker of the login form.
  if (isUserLoading) {
    return (
      <>
        <CircularIndeterminate color="secondary" />
        <Typography variant="subtitile1" sx={{ pt: 4, ml: "1ch" }}>
          Loading user session...
        </Typography>
      </>
    );
  }

  // 2. When the user is logged in (firebaseUser is successfully set via onIdTokenChanged),
  // show the main application layout
  if (firebaseUser) {
    return (
      <>
        <AppBar NAV_HEIGHT={NAV_HEIGHT} SIDEBAR_WIDTH={SIDEBAR_WIDTH} />

        <Box
          {...appMainProps}
          sx={{
            ...appMainProps.sx,
            flexFlow: isDesktop ? "row nowrap" : "column nowrap", // Stack children vertically
            padding: `${NAV_HEIGHT} 0 ${BOTTOM_NAV_HEIGHT} 0`,
          }}
        >
          {isDesktop && (
            <Box
              className="sidebar--container"
              sx={{
                position: "fixed",
                top: `calc(${NAV_HEIGHT})`,
                left: 0,
                zIndex: 100,
                width: SIDEBAR_WIDTH,
                height: `calc(100% - ${NAV_HEIGHT})`,
                overflow: "hidden",
              }}
            >
              <SideNavBar />
            </Box>
          )}

          <Box {...pageProps} sx={{ ...pageProps.sx, pl: SIDEBAR_WIDTH }}>
            {children}
          </Box>

          {!isDesktop && appContext !== "home" ? (
            <CustomBottomNav BOTTOM_NAV_HEIGHT={BOTTOM_NAV_HEIGHT} />
          ) : null}
        </Box>
      </>
    );
  }

  // 3. When the user is definitively logged out (not loading, no firebaseUser),
  // show the authentication forms
  return (
    <>
      <Typography variant="h4" component="h1">
        {isSigningUp ? "Create Account" : "Welcome Back"}
      </Typography>

      {isSigningUp ? <SignUpForm /> : <LoginForm />}

      <Button
        onClick={toggleAuthMode}
        variant="text"
        size="small"
        sx={{ textTransform: "none", mt: 1 }}
      >
        {isSigningUp
          ? "Already have an account? Log In"
          : "Don't have an account? Sign Up"}
      </Button>
    </>
  );
}
const appMainProps = {
  className: "app--main",
  component: "main",
  sx: {
    width: "100%",
    height: `100%`,

    display: "flex",
    // justifyContent: "center",
    // alignItems: "center",
    backgroundColor: "page.background",
    overflow: "hidden",
  },
};
const pageProps = {
  className: "page",
  component: "",
  sx: {
    position: "relative",
    width: "100%",
    height: "100%",
    display: "flex",
    flexFlow: "column nowrap",
    backgroundColor: "page.background",
  },
};
