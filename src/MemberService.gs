class MemberService {

  static create(data) {

    if (!data.name || data.name.trim() === "") {
      throw new Error("Informe o nome.");
    }

    const member = {

      id: IdService.nextMemberId(),

      name: data.name.trim(),

      phone: data.phone || "",

      family: data.family || "",

      ministry: data.ministry || "",

      tither: data.tither,

      active: true,

      createdAt: new Date(),

      updatedAt: new Date()

    };

    MemberRepository.save(member);

    return member;

  }

}