import React, { useEffect, useLayoutEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { MENU_ITEMS } from "@/constants";
import { actionItemClick } from "@/Slice/menuSlice";
import { socket } from "@/socket";
export default function Board() {
  const dispatch = useDispatch();
  const {activeMenuItem, actionMenuItem} = useSelector((state) => state.menu);
  const { color, size } = useSelector((state) => state.toolbox[activeMenuItem]);
  const canvaRef = useRef(null);
  const shouldDraw = useRef(false);
  const drawHistory = useRef([]);
  const historyPointer = useRef(0);

  useEffect(() => {
    if (!canvaRef.current) {
      return;
    }

    const canvas = canvaRef.current;
    const context = canvas.getContext("2d");

    if(actionMenuItem === MENU_ITEMS.DOWNLOAD){
      const url = canvas.toDataURL();
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'sketch.png';
      anchor.click();
    }
    else if(actionMenuItem === MENU_ITEMS.UNDO || actionMenuItem === MENU_ITEMS.REDO){
      if(historyPointer.current > 0 && actionMenuItem === MENU_ITEMS.UNDO) historyPointer.current -= 1;
       if(historyPointer.current < drawHistory.current.length - 1 && actionMenuItem == MENU_ITEMS.REDO) historyPointer.current += 1;
           const image = drawHistory.current[historyPointer.current];
           context.putImageData(image, 0, 0);

         

    }

    dispatch(actionItemClick(null))
  }, [actionMenuItem, dispatch]);

  useEffect(() => {
    if (!canvaRef.current) {
      return;
    }

    const canvas = canvaRef.current;
    const context = canvas.getContext("2d");

    const changeConfig = (color, size) => {
      context.strokeStyle = color;
      context.lineWidth = size;
    };

    const handleChangeConfig = (config) => {
        changeConfig(config.color, config.size);
    }

    changeConfig(color, size);
    socket.on('changeConfig', handleChangeConfig);

    return  () => {
           socket.off('changeConfig', handleChangeConfig);
    }
  }, [color, size]);

  //This useEffect of for mount side

  useLayoutEffect(() => {
    if (!canvaRef.current) {
      return;
    }

    const canvas = canvaRef.current;
    const context = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const beginPath = (x, y) => {
      context.beginPath();
      context.moveTo(x, y);
    };

    const drawLine = (x, y) => {
      context.lineTo(x, y);
      context.stroke();
    };

    const handleMouseDown = (e) => {
      shouldDraw.current = true;

      beginPath(e.clientX, e.clientY);
      socket.emit('beginPath', {x : e.clientX, y : e.clientY})
    };
    const handleMouseMove = (e) => {
      if (!shouldDraw.current) return;

      drawLine(e.clientX, e.clientY);
      socket.emit('drawLine', {x : e.clientX, y : e.clientY})
    };
    const handleMouseUp = (e) => {
      shouldDraw.current = false;
      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      drawHistory.current.push(image);
      historyPointer.current = drawHistory.current.length - 1;
    };

    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(0, 0);
    context.stroke();


    const handleBeginPath = (paths) => {
           beginPath(paths.x, paths.y);
    }

    const handleDrawLine = (paths) => {
      drawLine(paths.x, paths.y);
    }

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    socket.on('beginPath', handleBeginPath);
    socket.on('drawLine', handleDrawLine);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      socket.off('beginPath', handleBeginPath);
      socket.off('drawLine', handleDrawLine);
    };
  }, []);

  return (
    <>
      <canvas ref={canvaRef}></canvas>
    </>
  );
}
