function onOpen(e) {

  try {
    Menu.build();
  } catch(err) {
    Logger.log(err);
  }

}

function install() {
  Installer.run();
}