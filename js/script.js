'use strict';

/* ============================================================
   SKRYPT DO PROJEKTU Z FIZYKI

   Kod jest podzielony na cztery niezależne części:
   1. przełączanie stron,
   2. kalkulator prędkości średniej,
   3. prędkościomierz,
   4. quiz i pokaz sił.

   Każda część jest w osobnej funkcji, żeby jedna rzecz nie psuła drugiej.
   ============================================================ */


/* ------------------------------------------------------------
   1. PRZEŁĄCZANIE STRON
   ------------------------------------------------------------ */
function uruchomNawigacje() {
  // Pobieram wszystkie sekcje ze stronami. Array.from robi z NodeList zwykłą tablicę,
  // dzięki czemu mogę później wygodnie używać findIndex i forEach.
  const strony = Array.from(document.querySelectorAll('.page'));
  if (!strony.length) return;

  const zakladki = Array.from(document.querySelectorAll('.tab'));
  const kropkiBox = document.getElementById('dots');
  const licznik = document.getElementById('pageNow');
  const pasekPostepu = document.getElementById('progressFill');
  const przyciskWstecz = document.getElementById('prev');
  const przyciskDalej = document.getElementById('next');

  let aktualna = 0;

  // Kropki na dole tworzę w JavaScript, bo wtedy nie muszę ich ręcznie
  // dopisywać, gdyby kiedyś doszła jeszcze jedna strona.
  strony.forEach(function (strona, indeks) {
    if (!kropkiBox) return;

    const kropka = document.createElement('button');
    kropka.type = 'button';
    kropka.className = 'dot';
    kropka.setAttribute('aria-label', 'Strona ' + (indeks + 1) + ': ' + strona.dataset.title);
    kropka.addEventListener('click', function () {
      pokazStrone(indeks);
    });

    kropkiBox.appendChild(kropka);
  });

  const kropki = Array.from(document.querySelectorAll('.dot'));

  // Główna funkcja nawigacji. Przyjmuje numer strony i pokazuje tylko tę jedną.
  function pokazStrone(numer, zapiszHash) {
    // Dzięki reszcie z dzielenia nawigacja działa w kółko:
    // po ostatniej stronie "dalej" wraca na pierwszą.
    aktualna = (numer + strony.length) % strony.length;

    strony.forEach(function (strona, indeks) {
      const czyAktywna = indeks === aktualna;

      strona.classList.toggle('is-active', czyAktywna);
      // aria-hidden mówi czytnikom ekranu, które strony są ukryte.
      strona.setAttribute('aria-hidden', czyAktywna ? 'false' : 'true');
    });

    zakladki.forEach(function (zakladka, indeks) {
      const czyAktywna = indeks === aktualna;
      zakladka.classList.toggle('is-active', czyAktywna);
      if (czyAktywna) {
        zakladka.setAttribute('aria-current', 'page');
      } else {
        zakladka.removeAttribute('aria-current');
      }
    });

    kropki.forEach(function (kropka, indeks) {
      kropka.classList.toggle('is-active', indeks === aktualna);
    });

    // Numer strony zapisany jako 01, 02 itd. — padStart dodaje zero z przodu.
    if (licznik) {
      licznik.textContent = String(aktualna + 1).padStart(2, '0');
    }

    if (pasekPostepu) {
      pasekPostepu.style.width = ((aktualna + 1) / strony.length * 100) + '%';
    }

    // Przy zmianie strony wracam na samą górę. Bez tego po przewinięciu
    // długiej strony następna otwierałaby się w środku.
    window.scrollTo(0, 0);

    // Adres z #nazwa strony pozwala wysłać komuś link do konkretnej notatki.
    // replaceState nie robi nowego wpisu w historii, żeby "wstecz" nie cofało
    // kilkunastu kliknięć po slajdach.
    if (zapiszHash !== false) {
      try {
        history.replaceState(null, '', '#' + strony[aktualna].id);
      } catch (blad) {
        // Na niektórych przeglądarkach przy pliku otwartym z dysku
        // historia może być zablokowana. Wtedy po prostu jej nie zmieniam.
      }
    }
  }

  // Przyciski ze strzałkami.
  if (przyciskWstecz) {
    przyciskWstecz.addEventListener('click', function () {
      pokazStrone(aktualna - 1);
    });
  }

  if (przyciskDalej) {
    przyciskDalej.addEventListener('click', function () {
      pokazStrone(aktualna + 1);
    });
  }

  // Kliknięcie zakładki po prawej stronie.
  zakladki.forEach(function (zakladka) {
    zakladka.addEventListener('click', function () {
      pokazStrone(Number(zakladka.dataset.index));
    });
  });

  // Klawiatura: strzałki, Page Up/Down, Home i End.
  document.addEventListener('keydown', function (zdarzenie) {
    const cel = zdarzenie.target;

    // Jeśli ktoś wpisuje liczbę w kalkulatorze albo przesuwa suwak,
    // strzałki mają zmieniać wartość, a nie przewracać stronę.
    // Sprawdzam closest, bo zdarzenie może czasem trafić w document,
    // a document nie ma takiej funkcji.
    if (cel && cel.closest && cel.closest('input, textarea, select, [contenteditable="true"]')) {
      return;
    }

    if (zdarzenie.key === 'ArrowRight' || zdarzenie.key === 'PageDown') {
      zdarzenie.preventDefault();
      pokazStrone(aktualna + 1);
    } else if (zdarzenie.key === 'ArrowLeft' || zdarzenie.key === 'PageUp') {
      zdarzenie.preventDefault();
      pokazStrone(aktualna - 1);
    } else if (zdarzenie.key === 'Home') {
      zdarzenie.preventDefault();
      pokazStrone(0);
    } else if (zdarzenie.key === 'End') {
      zdarzenie.preventDefault();
      pokazStrone(strony.length - 1);
    }
  });

  // Przesuwanie palcem po ekranie telefonu.
  let poczatekX = 0;
  let poczatekY = 0;

  document.addEventListener('touchstart', function (zdarzenie) {
    // Dotknięcie suwaka albo przycisku nie powinno zmieniać strony.
    if (zdarzenie.target.closest && zdarzenie.target.closest('input, button')) return;

    poczatekX = zdarzenie.touches[0].clientX;
    poczatekY = zdarzenie.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', function (zdarzenie) {
    if (!poczatekX && !poczatekY) return;

    const koniecX = zdarzenie.changedTouches[0].clientX;
    const koniecY = zdarzenie.changedTouches[0].clientY;
    const ruchX = koniecX - poczatekX;
    const ruchY = koniecY - poczatekY;

    // Reaguję tylko na wyraźny ruch w poziomie. Ruch w pionie ma zostawić
    // normalne przewijanie strony.
    if (Math.abs(ruchX) > 55 && Math.abs(ruchX) > Math.abs(ruchY) * 1.2) {
      if (ruchX < 0) {
        pokazStrone(aktualna + 1);
      } else {
        pokazStrone(aktualna - 1);
      }
    }

    poczatekX = 0;
    poczatekY = 0;
  }, { passive: true });

  // Jeśli w adresie jest #quiz albo #newton, otwieram od razu tę stronę.
  const idZAdresu = window.location.hash.replace('#', '');
  const indeksZAdresu = strony.findIndex(function (strona) {
    return strona.id === idZAdresu;
  });

  pokazStrone(indeksZAdresu >= 0 ? indeksZAdresu : 0, false);

  // Gdy ktoś ręcznie zmieni # w adresie, strona też się przełączy.
  window.addEventListener('hashchange', function () {
    const noweId = window.location.hash.replace('#', '');
    const nowyIndeks = strony.findIndex(function (strona) {
      return strona.id === noweId;
    });

    if (nowyIndeks >= 0 && nowyIndeks !== aktualna) {
      pokazStrone(nowyIndeks, false);
    }
  });
}


/* ------------------------------------------------------------
   2. KALKULATOR PRĘDKOŚCI ŚREDNIEJ
   ------------------------------------------------------------ */
function uruchomKalkulator() {
  const przycisk = document.getElementById('calcBtn');
  const poleDrogi = document.getElementById('distance');
  const poleCzasu = document.getElementById('travelTime');
  const wynik = document.getElementById('calcOut');

  if (!przycisk || !poleDrogi || !poleCzasu || !wynik) return;

  // Zaokrąglam do dwóch miejsc po przecinku i zamieniam kropkę na przecinek,
  // bo w Polsce liczby zapisuje się właśnie tak.
  function ladnaLiczba(liczba) {
    const zaokraglona = Math.round(liczba * 100) / 100;
    return String(zaokraglona).replace('.', ',');
  }

  // Ludzie wpisują liczby raz z kropką, raz z przecinkiem (12.5 albo 12,5).
  // parseFloat sam zrozumie tylko kropkę, więc wcześniej zamieniam przecinek.
  function naLiczbe(tekst) {
    return parseFloat(String(tekst).trim().replace(',', '.'));
  }

  function policz() {
    const droga = naLiczbe(poleDrogi.value);
    const czas = naLiczbe(poleCzasu.value);

    // Czas musi być większy od zera, bo nie dzielimy przez zero.
    // Droga może być zerowa — wtedy prędkość też wyjdzie zero.
    if (!Number.isFinite(droga) || !Number.isFinite(czas) || droga < 0 || czas <= 0) {
      wynik.classList.remove('is-ok');
      wynik.classList.add('is-error');
      wynik.textContent = 'wpisz poprawne liczby (czas musi być większy od zera)';
      return;
    }

    const predkosc = droga / czas;

    wynik.classList.remove('is-error');
    wynik.classList.add('is-ok');
    wynik.innerHTML =
      'v<sub>śr</sub> = ' + ladnaLiczba(droga) + ' km / ' + ladnaLiczba(czas) +
      ' h = <b>' + ladnaLiczba(predkosc) + ' km/h</b>';
  }

  przycisk.addEventListener('click', policz);

  // Enter w polu też ma liczyć — tak jest wygodniej.
  [poleDrogi, poleCzasu].forEach(function (pole) {
    pole.addEventListener('keydown', function (zdarzenie) {
      if (zdarzenie.key === 'Enter') {
        zdarzenie.preventDefault();
        policz();
      }
    });
  });
}


/* ------------------------------------------------------------
   3. PRĘDKOŚCIOMIERZ
   ------------------------------------------------------------ */
function uruchomPredkosciomierz() {
  const suwak = document.getElementById('speedRange');
  const igla = document.getElementById('speedNeedle');
  const odczyt = document.getElementById('speedValue');
  const kreski = document.getElementById('speedTicks');

  if (!suwak || !igla || !odczyt || !kreski) return;

  const srodekX = 170;
  const srodekY = 170;
  const promien = 120;

  // Rysuję kreski i liczby na tarczy. Kąt 150° to lewy dół, a 390° (czyli 30°)
  // to prawy dół — dzięki temu skala przechodzi górą, jak w prawdziwym liczniku.
  for (let wartosc = 0; wartosc <= 160; wartosc += 10) {
    const kat = 150 + (wartosc / 160) * 240;
    const radiany = kat * Math.PI / 180;
    const duza = wartosc % 40 === 0;
    const dlugosc = duza ? 18 : 9;

    const linia = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    linia.setAttribute('x1', srodekX + Math.cos(radiany) * (promien - 3));
    linia.setAttribute('y1', srodekY + Math.sin(radiany) * (promien - 3));
    linia.setAttribute('x2', srodekX + Math.cos(radiany) * (promien - 3 - dlugosc));
    linia.setAttribute('y2', srodekY + Math.sin(radiany) * (promien - 3 - dlugosc));
    linia.setAttribute('stroke-width', duza ? 2.5 : 1.4);
    kreski.appendChild(linia);

    // Podpisuję tylko większe wartości, żeby tarcza nie była zbyt gęsta.
    if (duza) {
      const podpis = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      const odlegloscPodpisu = promien + 21;
      podpis.setAttribute('x', srodekX + Math.cos(radiany) * odlegloscPodpisu);
      podpis.setAttribute('y', srodekY + Math.sin(radiany) * odlegloscPodpisu + 5);
      podpis.textContent = String(wartosc);
      kreski.appendChild(podpis);
    }
  }

  function ustawPredkosc(wartosc) {
    // Igła jest narysowana pionowo. Przy zerze obracam ją o -120°,
    // przy 160 km/h o +120°. Wszystko pomiędzy idzie proporcjonalnie.
    const kat = -120 + (Number(wartosc) / 160) * 240;
    igla.style.transform = 'rotate(' + kat + 'deg)';
    odczyt.textContent = wartosc;
  }

  suwak.addEventListener('input', function () {
    ustawPredkosc(suwak.value);
  });

  // Ustawiam stan początkowy, żeby igła od razu stała na zero.
  ustawPredkosc(suwak.value);
}


/* ------------------------------------------------------------
   4A. POKAZ SIŁ
   ------------------------------------------------------------ */
function uruchomPokazSil() {
  const lewySuwak = document.getElementById('leftForce');
  const prawySuwak = document.getElementById('rightForce');
  const lewyWynik = document.getElementById('leftValue');
  const prawyWynik = document.getElementById('rightValue');
  const lewaLinia = document.getElementById('forceLeftLine');
  const prawaLinia = document.getElementById('forceRightLine');
  const lewyPodpis = document.getElementById('forceLeftLabel');
  const prawyPodpis = document.getElementById('forceRightLabel');
  const werdykt = document.getElementById('forceVerdict');

  if (!lewySuwak || !prawySuwak || !werdykt) return;

  const lewyStart = 160;
  const prawyStart = 260;
  const yStrzalki = 105;

  function rysujSily() {
    const lewa = Number(lewySuwak.value);
    const prawa = Number(prawySuwak.value);

    lewyWynik.textContent = lewa;
    prawyWynik.textContent = prawa;

    // Długość strzałki rośnie razem z siłą. Dodaję 24 piksele,
    // żeby nawet mała siła była widoczna jako strzałka.
    const lewaDlugosc = lewa === 0 ? 0 : 24 + lewa * 10;
    const prawaDlugosc = prawa === 0 ? 0 : 24 + prawa * 10;

    const lewyKoniec = lewyStart - lewaDlugosc;
    const prawyKoniec = prawyStart + prawaDlugosc;

    lewaLinia.setAttribute('x2', lewyKoniec);
    prawaLinia.setAttribute('x2', prawyKoniec);

    lewaLinia.style.visibility = lewa === 0 ? 'hidden' : 'visible';
    prawaLinia.style.visibility = prawa === 0 ? 'hidden' : 'visible';
    lewyPodpis.style.visibility = lewa === 0 ? 'hidden' : 'visible';
    prawyPodpis.style.visibility = prawa === 0 ? 'hidden' : 'visible';

    // Podpis siły ustawiam na środku strzałki.
    lewyPodpis.setAttribute('x', (lewyStart + lewyKoniec) / 2);
    prawyPodpis.setAttribute('x', (prawyStart + prawyKoniec) / 2);
    lewyPodpis.textContent = 'F₁ = ' + lewa + ' N';
    prawyPodpis.textContent = 'F₂ = ' + prawa + ' N';

    // Sprawdzam, czy siły są równe. To jest właśnie warunek "siły się równoważą"
    // z I zasady dynamiki.
    if (lewa === prawa) {
      werdykt.className = 'verdict balanced';

      if (lewa === 0) {
        werdykt.textContent = 'Żadna siła nie działa — możliwy spoczynek albo ruch jednostajny prostoliniowy.';
      } else {
        werdykt.textContent = 'Siły się równoważą — możliwy spoczynek albo ruch jednostajny prostoliniowy.';
      }
    } else {
      werdykt.className = 'verdict unbalanced';
      werdykt.textContent = 'Siły się nie równoważą. Prędkość ciała będzie się zmieniać — to już nie jest przypadek z I zasady.';
    }
  }

  lewySuwak.addEventListener('input', rysujSily);
  prawySuwak.addEventListener('input', rysujSily);

  // Szybkie ustawienia, żeby nie trzeba było dokładnie trafiać suwakami.
  const presety = Array.from(document.querySelectorAll('[data-left][data-right]'));
  presety.forEach(function (przycisk) {
    przycisk.addEventListener('click', function () {
      lewySuwak.value = przycisk.dataset.left;
      prawySuwak.value = przycisk.dataset.right;
      rysujSily();
    });
  });

  rysujSily();
}


/* ------------------------------------------------------------
   4B. QUIZ
   ------------------------------------------------------------ */
function uruchomQuiz() {
  const pytania = Array.from(document.querySelectorAll('.question'));
  const poleWyniku = document.getElementById('score');
  const notatkaWyniku = document.getElementById('scoreNote');
  const reset = document.getElementById('quizReset');

  if (!pytania.length || !poleWyniku || !notatkaWyniku) return;

  let punkty = 0;

  function liczbaOdpowiedzi() {
    return pytania.filter(function (pytanie) {
      return pytanie.dataset.answered === 'yes';
    }).length;
  }

  function opiszWynik() {
    const odpowiedziano = liczbaOdpowiedzi();
    const wszystkie = pytania.length;

    if (odpowiedziano === 0) {
      notatkaWyniku.textContent = 'kliknij odpowiedzi powyżej';
    } else if (odpowiedziano < wszystkie) {
      notatkaWyniku.textContent = 'odpowiedziano: ' + odpowiedziano + ' / ' + wszystkie;
    } else if (punkty === wszystkie) {
      notatkaWyniku.textContent = 'świetnie! wszystko dobrze';
    } else if (punkty >= wszystkie - 1) {
      notatkaWyniku.textContent = 'dobrze, prawie wszystko';
    } else if (punkty >= 2) {
      notatkaWyniku.textContent = 'jeszcze chwila powtórki i będzie lepiej';
    } else {
      notatkaWyniku.textContent = 'wróć do notatek i spróbuj jeszcze raz';
    }
  }

  pytania.forEach(function (pytanie) {
    const odpowiedzi = Array.from(pytanie.querySelectorAll('.answer'));
    const komentarz = pytanie.querySelector('.feedback');

    odpowiedzi.forEach(function (odpowiedz) {
      odpowiedz.addEventListener('click', function () {
        // Jedno pytanie można kliknąć tylko raz. Żeby spróbować ponownie,
        // trzeba użyć przycisku "jeszcze raz" na dole.
        if (pytanie.dataset.answered === 'yes') return;
        pytanie.dataset.answered = 'yes';

        const czyDobra = odpowiedz.dataset.correct === 'true';
        if (czyDobra) punkty++;

        odpowiedzi.forEach(function (inna) {
          inna.disabled = true;

          // Zawsze pokazuję poprawną odpowiedź na zielono,
          // nawet jeśli użytkownik wybrał złą.
          if (inna.dataset.correct === 'true') {
            inna.classList.add('correct');
          }
        });

        if (!czyDobra) {
          odpowiedz.classList.add('wrong');
        }

        komentarz.textContent = czyDobra
          ? 'Dobrze!'
          : 'Nie tym razem — poprawna odpowiedź jest na zielono.';
        komentarz.classList.add(czyDobra ? 'good' : 'bad');

        poleWyniku.textContent = punkty + ' / ' + pytania.length;
        opiszWynik();
      });
    });
  });

  if (reset) {
    reset.addEventListener('click', function () {
      punkty = 0;

      // Najpierw czyszczę wszystkie pytania, a dopiero potem opisuję wynik.
      // Gdyby kolejność była odwrotna, funkcja opiszWynik widziałaby jeszcze
      // stare odpowiedzi i pokazywała zły komunikat.
      pytania.forEach(function (pytanie) {
        pytanie.dataset.answered = 'no';

        pytanie.querySelectorAll('.answer').forEach(function (odpowiedz) {
          odpowiedz.disabled = false;
          odpowiedz.classList.remove('correct', 'wrong');
        });

        const komentarz = pytanie.querySelector('.feedback');
        komentarz.textContent = '';
        komentarz.classList.remove('good', 'bad');
      });

      poleWyniku.textContent = '0 / ' + pytania.length;
      opiszWynik();
    });
  }

  opiszWynik();
}


/* ------------------------------------------------------------
   5. KOLESO FORTUNY
   ------------------------------------------------------------ */
function uruchomFortuny() {
  const przycisk = document.getElementById('fortuneBtn');
  const wynik = document.getElementById('fortuneResult');
  const lista = document.getElementById('fortuneList');

  if (!przycisk || !wynik || !lista) return;

  const nazwiska = Array.from(lista.querySelectorAll('li')).map(function (element) {
    return element.textContent.trim();
  });

  przycisk.addEventListener('click', function () {
    // Losowanie z listy czytelników.
    const wylosowane = nazwiska[Math.floor(Math.random() * nazwiska.length)];
    wynik.textContent = 'Kto dziś będzie czytał: ' + wylosowane;
  });
}


/* ------------------------------------------------------------
   START
   ------------------------------------------------------------ */

// document.readyState sprawdzam na wszelki wypadek. Skrypt ma defer,
// więc zwykle DOM jest już gotowy, ale ten warunek nic nie kosztuje.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    uruchomNawigacje();
    uruchomKalkulator();
    uruchomPredkosciomierz();
    uruchomPokazSil();
    uruchomQuiz();
    uruchomFortuny();
  });
} else {
  uruchomNawigacje();
  uruchomKalkulator();
  uruchomPredkosciomierz();
  uruchomPokazSil();
  uruchomQuiz();
  uruchomFortuny();
}
