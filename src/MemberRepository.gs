class MemberRepository {

  static save(member) {

    Database.append(SHEETS.MEMBERS, [
      member.id,
      member.name,
      member.phone,
      member.family,
      member.ministry,
      member.tither ? "Sim" : "Não",
      member.active ? "Sim" : "Não",
      member.createdAt,
      member.updatedAt
    ]);

  }

  static findAll() {

    const values = Database.values(SHEETS.MEMBERS);

    values.shift();

    return values;

  }

  static listForSelect() {

    return this.findAll().map(row => ({
      id: row[0],
      name: row[1]
    }));

  }

  static existsByName(name) {

    const target = String(name).trim().toLowerCase();

    return this.findAll().some(row =>
      String(row[1]).trim().toLowerCase() === target
    );

  }

}