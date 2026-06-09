import { initMenu } from "./menu.js";

initMenu();

if (document.querySelector(".font-nothingyoucoulddo")) {
  import("@fontsource/nothing-you-could-do/latin-400.css");
}

if (document.querySelector("[data-fancybox]")) {
  import("./fancybox.js");
}
