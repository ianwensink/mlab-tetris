interface IMoves {
  [key: string]: () => void;

  left: () => void;
  right: () => void;
  rotate: () => void;
  up: () => void;
  down: () => void;
  timer: () => void;
}

export default IMoves;
