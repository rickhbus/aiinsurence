"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

export function ReducedMotionWrapper(props: HTMLMotionProps<"div">) {
  const reduceMotion = useReducedMotion();
  const { initial, animate, transition, ...rest } = props;

  return (
    <motion.div
      initial={reduceMotion ? false : initial}
      animate={reduceMotion ? undefined : animate}
      transition={reduceMotion ? undefined : transition}
      {...rest}
    />
  );
}

