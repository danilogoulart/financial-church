/**
 * Salva comprovantes (imagem/PDF) numa pasta do Drive e devolve o link.
 * O ID da pasta fica em Script Properties; a pasta é criada na primeira vez.
 */
class DriveService {

  static folder() {

    const props = PropertiesService.getScriptProperties();
    const id = props.getProperty(PROPS.RECEIPTS_FOLDER_ID);

    if (id) {
      try {
        return DriveApp.getFolderById(id);
      } catch (err) {
        // pasta apagada/sem acesso: recria abaixo
      }
    }

    const folder = DriveApp.createFolder(APP.NAME + " - Comprovantes");
    props.setProperty(PROPS.RECEIPTS_FOLDER_ID, folder.getId());
    return folder;

  }

  /**
   * @param {{name:string, mimeType:string, bytes:string}} attachment base64
   * @return {string} URL do arquivo, ou "" se não houver anexo
   */
  static saveReceipt(attachment) {

    if (!attachment || !attachment.bytes) {
      return "";
    }

    const data = Utilities.base64Decode(attachment.bytes);

    const blob = Utilities.newBlob(
      data,
      attachment.mimeType || "application/octet-stream",
      attachment.name || "comprovante"
    );

    const file = this.folder().createFile(blob);

    return file.getUrl();

  }

}
