import React, { useContext,useRef,useState } from 'react';
import { Grid, Typography, Paper, makeStyles } from '@material-ui/core';
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import Webcam from "react-webcam";

import { drawHand } from "../utils";
import * as fp from "fingerpose";
// import ThumbsDownGesture from "./gestures/ThumbsDown.js";
import ThumbsDownGesture from '../gestures/ThumbsDown.js';
// import thumbs_down from "./img/thumbs_down.png";
import thumbs_down from '../img/thumbs_down.png';


import { SocketContext } from '../Context';

const useStyles = makeStyles((theme) => ({
  video: {
    width: '550px',
    [theme.breakpoints.down('xs')]: {
      width: '300px',
    },
  },
  gridContainer: {
    justifyContent: 'center',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  paper: {
    padding: '10px',
    border: '2px solid black',
    margin: '10px',
  },
}));

const VideoPlayer = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const { name, callAccepted, myVideo, userVideo, callEnded, stream, call } = useContext(SocketContext);
  const classes = useStyles();
  const [emoji, setEmoji] = useState(null);
  const images = {
    thumbs_down: thumbs_down,
  };
  const runHandpose = async () => {
    const net = await handpose.load();
    //console.log("handpose model loaded");
    // loop and detect hand
    setInterval(() => {
      detect(net)
    }, 100);

  }
  const detect = async (net) => {
    if (typeof webcamRef.current !== "undefined" && webcamRef.current != null && webcamRef.current.video.readyState === 4) {
      // get video properties
      const video = webcamRef.current.video;

      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;
      
      // make detection
      const hand = await net.estimateHands(video);

      if (hand.length > 0) {
        const GE = new fp.GestureEstimator([
          fp.Gestures.VictoryGesture,
          fp.Gestures.ThumbsUpGesture,
          ThumbsDownGesture
        ])
        const gesture = await GE.estimate(hand[0].landmarks, 8);
        if (gesture.gestures !== undefined && gesture.gestures.length > 0) {
          const confidence = gesture.gestures.map(
            (prediction) => prediction.score
          );
          const maxConfidence = confidence.indexOf(
            Math.max.apply(null, confidence)
          );
          setEmoji(gesture.gestures[maxConfidence].name);
        }
      }

      // Draw mesh
      const ctx = canvasRef.current.getContext("2d");
      drawHand(hand, ctx);

    }
  }

  runHandpose();

  return (
    
    <Grid container className={classes.gridContainer}>
      {stream && (
        <Paper className={classes.paper}>
        <video playsInline muted ref={myVideo} autoPlay className={classes.video} />
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>{name || 'Name'}</Typography>
            <Webcam ref={webcamRef}
            className={classes.video}
            playsInline
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 200,
            height: 200
          }} />
            
            <canvas ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 200,
            height: 200
          }} />
            {emoji !== null ? (
          <img
            src={images[emoji]}
            style={{
              position: "absolute",
              marginLeft: "auto",
              marginRight: "auto",
              left: 400,
              bottom: 500,
              right: 0,
              textAlign: "center",
              height: 100,
            }}
          />
        ) : (
          ""
        )}
          </Grid>
        </Paper>
      )}
      {callAccepted && !callEnded && (
        <Paper className={classes.paper}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>{call.name || 'Name'}</Typography>
            <video playsInline ref={userVideo} autoPlay className={classes.video} />
          </Grid>
        </Paper>
      )}
    </Grid>
  );
};

export default VideoPlayer;
