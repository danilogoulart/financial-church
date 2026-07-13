class MemberService {

  static create(data) {

    if (!data.name || data.name.trim() === "") {
      throw new Error("Nome é obrigatório.");
    }

    const now = new Date();

    const member = {

      id: IdService.nextMemberId(),

      name: data.name.trim(),

      phone: data.phone || "",

      family: data.family || "",

      ministry: data.ministry || "",

      tither: data.tither === true,

      active: true,

      createdAt: now,

      updatedAt: now

    };

    MemberRepository.save(member);

    return member;

  }

}