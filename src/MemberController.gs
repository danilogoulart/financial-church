function showMemberForm() {

  const html = HtmlService
    .createHtmlOutputFromFile("Member")
    .setWidth(450)
    .setHeight(520);

  SpreadsheetApp.getUi().showModalDialog(
    html,
    "Novo Membro"
  );

}

function saveMember(data) {

  return MemberService.create(data);

}