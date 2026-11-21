import { Link } from "@tanstack/react-router";

/** "Zásady ochrany osobních údajů" – GDPR information (Art. 13). Draft, to be checked by a lawyer. */
export function Soukromi() {
  return (
    <section className="box gdpr">
      <h2>Zásady ochrany osobních údajů</h2>
      <p className="note">Platí od 21. 11. 2026 pro testovací verzi aplikace.</p>

      <h3>Kdo údaje zpracovává</h3>
      <p>
        Správcem osobních údajů je <b>Lidový léčitel</b> (provozovatel aplikace). Dotazy a žádosti
        týkající se osobních údajů posílejte tlačítkem <b>💬 Komentář</b> v horní části aplikace.
      </p>

      <h3>Jaké údaje a proč</h3>
      <ul>
        <li>
          <b>Účet</b> (e-mail, jméno, profilový obrázek) – abyste se mohli přihlásit a mít profil na
          více zařízeních. Právní základ: plnění smlouvy (používání aplikace).
        </li>
        <li>
          <b>Zdravotní profil</b> (nemoci, alergie, léky, co vás trápí, co máte doma) – aby aplikace
          upozornila na možné střety bylin s léky a doporučila vhodné byliny. Jde o údaje o zdraví,
          proto je zpracováváme jen na základě vašeho <b>výslovného souhlasu</b> (čl. 9 odst. 2
          písm. a GDPR), který udělujete jejich vyplněním. Bez přihlášení zůstávají jen ve vašem
          zařízení.
        </li>
        <li>
          <b>Dotaz lékárníkovi</b> – v testovací verzi zůstává jen ve vašem zařízení a nikam se
          neodesílá. Před odesláním potvrzujete souhlas s těmito zásadami; pokud k dotazu připojíte
          přehled léků a potíží, souhlasíte i se zpracováním těchto údajů o zdraví.
        </li>
        <li>
          <b>Komentáře k aplikaci</b> (text, stránka, na které jste komentář psali, čas, typ
          zařízení a u přihlášených e-mail účtu) – abychom mohli aplikaci opravovat a zlepšovat.
          Právní základ: oprávněný zájem správce.
        </li>
      </ul>

      <h3>Kdo další k údajům má přístup</h3>
      <p>
        Údaje ukládáme u zpracovatelů, kteří pro nás zajišťují techniku: Supabase (databáze a
        přihlášení), Resend (odeslání komentáře e-mailem správci), Google (tabulka s komentáři) a
        Lovable (provoz webové verze). Někteří z nich mohou údaje zpracovávat i mimo EU na základě
        standardních smluvních doložek EU. Údaje neprodáváme a nepoužíváme k reklamě.
      </p>

      <h3>Jak dlouho</h3>
      <p>
        Údaje účtu a profilu po dobu existence účtu. Komentáře nejdéle 3 roky. Údaje uložené jen v
        zařízení smažete v profilu tlačítkem „Vymazat moje data“.
      </p>

      <h3>Vaše práva</h3>
      <p>
        Máte právo na přístup k údajům, jejich opravu, výmaz, omezení zpracování a přenositelnost,
        právo vznést námitku a kdykoli odvolat souhlas (odvolání nemá vliv na zpracování před ním).
        Můžete také podat stížnost u Úřadu pro ochranu osobních údajů (www.uoou.gov.cz).
      </p>

      <p className="note">
        Testovací verze – text zatím nezkontroloval právník a může se změnit.{" "}
        <Link to="/profil">Zpět do profilu</Link>
      </p>
    </section>
  );
}
