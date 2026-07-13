class MemberRepository {

  static save(member) {

    Database.append(
      SHEETS.MEMBERS,
      [
        member.id,
        member.name,
        member.phone,
        member.family,
        member.ministry,
        member.tither,
        member.active,
        member.createdAt,
        member.updatedAt
      ]
    );

  }

  static findAll() {

    const values = Database.values(SHEETS.MEMBERS);

    values.shift();

    return values;

  }

  static listForSelect() {

    const values = Database.values(SHEETS.MEMBERS);

    values.shift();

    return values.map(v => ({
        id: v[0],
        name: v[1]
    }));

 }

}