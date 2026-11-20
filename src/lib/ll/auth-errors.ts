/** Czech wording for the auth errors a visitor can actually cause. */
export function czAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Nesprávný e-mail nebo heslo.";
  if (m.includes("email not confirmed")) return "E-mail ještě není potvrzený. Klikněte na odkaz, který jsme vám poslali.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Tento e-mail už je zaregistrovaný. Zkuste se přihlásit.";
  if (m.includes("password") && (m.includes("at least") || m.includes("short"))) return "Heslo musí mít aspoň 8 znaků.";
  if (m.includes("weak") || m.includes("pwned") || m.includes("leaked")) return "Toto heslo je příliš slabé nebo uniklo na internet. Zvolte jiné.";
  if (m.includes("same") && m.includes("password")) return "Nové heslo musí být jiné než to původní.";
  if (m.includes("rate limit") || m.includes("too many") || m.includes("security purposes")) return "Příliš mnoho pokusů. Zkuste to za chvíli.";
  if (m.includes("session") && m.includes("missing")) return "Odkaz pro obnovu hesla vypršel. Požádejte o nový.";
  if (m.includes("invalid") && m.includes("email")) return "Zadejte platný e-mail.";
  return "Něco se nepovedlo. Zkuste to prosím znovu.";
}
