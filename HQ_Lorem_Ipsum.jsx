#target "InDesign"

/*
 * HQ_Lorem_Ipsum — faux texte latin, remplacement EN PLACE.
 *
 * Chaque mot (et chaque nombre) est remplacé par un mot latin de MÊME CHASSE
 * (largeur estimée à l'écran, pas nombre de lettres), avec la même casse.
 * Tout le reste (ponctuation, espaces, retours de paragraphe, insécables,
 * tabulations, objets ancrés, notes, tableaux) n'est pas touché : la mise en
 * forme et les styles restent ceux du texte d'origine, et les lignes tombent
 * à peu près aux mêmes endroits.
 *
 * Largeurs : table de proportions moyennes (Times / Helvetica), indépendante
 * de la police réellement appliquée. Voir la section 4.
 *
 * Fonctionne sur : un cadre de texte, un texte sélectionné (caractères, mots,
 * lignes, paragraphes), une cellule de tableau. Plusieurs éléments sélectionnés
 * sont tous traités. Annulable en un seul Cmd+Z.
 *
 * Le code est en ASCII (\u...) pour éviter tout problème d'encodage ;
 * seuls les commentaires contiennent des accents.
 */

(function () {

    // ---------------------------------------------------------
    // 1. Vérifications
    // ---------------------------------------------------------

    if (app.documents.length === 0) {
        alert("Aucun document InDesign n'est ouvert.");
        return;
    }

    if (app.selection.length === 0) {
        alert("S\u00E9lectionnez un cadre de texte ou du texte avant de lancer le script.");
        return;
    }


    // ---------------------------------------------------------
    // 2. Banque de vocabulaire latin (classée par longueur)
    // ---------------------------------------------------------

    var latinWords = [
        "a e o",
        "amor bene dies deus homo mare mens nunc pars rosa sine vita unde nova alma opus iter",
        "et in ad ex ut si ne ab de",
        "est sed hic qui non cum iam res lex ars vir ius",
        "lorem dolor fames causa bonus magna altus novus omnis multi verum forum ratio regis liber aetas orbis humus mater pater domus coram finis",
        "filium filius tempus mundus natura populi virtus amicus animus corpus magnum regnum civium patria domini caelum",
        "memoria familia civitas senatus fortuna veritas amantes dominus fidelis publica aetatis gloriam bellum",
        "imperium doctrina libertas peritus auctoris veritate praesens",
        "delenda magnitudo providens concordia fortitudo aequitate sententia sapientia",
        "temporibus institutio eloquentia beneficium respublica praeclarus disciplina dignitatem voluntatis gratiaeque",
        "philosophia necessarius perpetuitas sempiternus humanitatis auctoritate communitas",
        "contemplatio argumentatio communicatio administrare universitate dignitatibus",
        "intelligentia circumstantia magnificentia administratio interpretatio constitutione",
        "extraordinaria consideratione",
        "extraordinarius comprehensione significationes",
        "reconciliatione transformatione",
        "philosophicarum constitutionibus",
        "administrationibus",
        "transubstantiatio",
        "reconciliationes consuetudinis",
        "an at ac me te se ei is id it ea eo hi ob",
        "per pro sub nec aut vel cur nam hac hoc rex lux dux pax nox vox rem rei eum eam eos ego nos vos sum fit fac dic duc ibi ubi tam quo qua mox pes mel sol mos nil ora ova sic",
        "aqua arma ante apud bona casa cave cito clam coma cras cura dare dein dona ecce esse fama fata fide flos foro fuga gens hanc haec hora hunc idem illa illi ipse isti item iura lana laus lego lupa lupi male manu mala malo mane mari meus mihi mira modo mors motu navi nemo nisi onus opes orbi ovis pace pane para paro pati pede pila plus pons pone post prae puer pura quam quid quin quis quod rara rege rego rete ripa risu sale sana sano sede semi sero sibi sive sola soli solo sors spes stat suae sunt suus suum tela tene tibi tres tuae tuum urbe usus uter vale veni vera vero vici vide vino viri visu vitae voce volo vota enim erat",
        "agere alius amici amica amare ardet atque audio autem bella belli bonum certe civis clara clare copia corde crede culpa cursu datum debet decem dicit dicta docet domum donec dulce equus facit facta falsa fatum felix ferre festo fides filii flore forte fugit genus gerit grata gravi habet hodie ignis iudex labor laeta lapis legis lenis levis libri licet locus longa lucem lumen lunae magis manus matri media mille minor mirum mitto modus molli monte morte mores mundi natus navis nobis nulla oculi omnes opera ordo parum patet patri pauci pedes plena porta posse potes prima primo prius quare quasi regni reges rerum sacra saepe salus sanus sedes semel senex serva servo signa silva simul solum sonus stare statu super talis tamen tenet terra totum tuus ultra umbra usque valde venit verba verbi video viris vitam vivit vobis vultu",
        "absens accipe adesse aetate amicus amorem animal aurora bellum cantus capere clemens cogito corona credit cuncta cursus debuit dolore domina donare dulcis errare exitus ferrum festus fiunt flumen foedus fugere futura gaudium gentes gratia gravis habere honore humana iuvenis laudes lector libera litora magnus maiora mensis mentem mirari moenia montes mortis nostra nutrix omnium opibus oratio patres pectus pelago plures portae potest primum quidam rector regina rursum sacrum saluti scribo sensus servus",
        "amicitia animalia aquarum bellica bonitas caritas civibus clarius comites consilia corpora cultura decorum dominos dulcius ecclesia exemplum fabulae familiae felicis flumina fructus gaudium genitor gloria gratias heredis honores humilis imperio ingenium iustitia legatus liberum litteras lucrum magister maiores manibus mansio materia mensura miserae mortales multitudo natione nobilis nostrum notitia nutrimen officium oratores ordines pariter patriae pecunia periculo populus pretium principi pulcher quaerere quoniam regnorum sanguis scientia secundus sermonem servitus silentium solitudo studiorum",
        "adiutorium aeternitas amicitiae bonitatis caelestis civitatis clementia communis consuetudo cupiditas dignitas ecclesiae experientia fortitudo gratitudo habitatio imaginatio iudicium laetitia libertatem magistratus misericordia nationibus obligatio occasione paulatim pestilentia potentiae praesentia principium providentia quaestione sapienter scripturae sollicitudo substantia tranquillitas utilitatis voluptatem",
        "adversitatibus comprehensio conversatione educationibus imperatoribus incorruptibilis ingeniosissimus negotiationibus obscuritatibus occupationibus reprehensionibus"
    ];

    var wordsByLength = {};
    (function () {
        for (var i = 0; i < latinWords.length; i++) {
            var words = latinWords[i].split(/\s+/);
            for (var j = 0; j < words.length; j++) {
                var w = words[j];
                if (!w) { continue; }
                if (!wordsByLength[w.length]) { wordsByLength[w.length] = []; }
                wordsByLength[w.length].push(w);
            }
        }
    })();


    // ---------------------------------------------------------
    // 3. Aléatoire reproductible (graine = heure, donc varie à chaque lancement)
    // ---------------------------------------------------------

    var seed = (new Date().getTime() % 2147483647) || 1;

    function random() {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
    }


    // ---------------------------------------------------------
    // 4. Générateur de secours (longueurs absentes de la banque)
    // ---------------------------------------------------------

    var syllables = [
        "ae", "au", "be", "ca", "ce", "ci", "co", "cu", "de", "di", "do", "du",
        "fa", "fe", "fi", "fo", "ga", "ge", "gi", "go", "la", "le", "li", "lo",
        "lu", "ma", "me", "mi", "mo", "mu", "na", "ne", "ni", "no", "nu", "pa",
        "pe", "pi", "po", "pu", "ra", "re", "ri", "ro", "ru", "sa", "se", "si",
        "so", "su", "ta", "te", "ti", "to", "tu", "va", "ve", "vi", "vo"
    ];

    function generateWord(length) {
        var result = "";
        while (result.length < length) {
            var s = syllables[Math.floor(random() * syllables.length)];
            if (result.length + s.length > length) {
                s = s.substring(0, length - result.length);
            }
            result += s;
        }
        return result;
    }


    // ---------------------------------------------------------
    // 4b. Chasse : largeur estimée des mots
    // ---------------------------------------------------------
    // Largeurs en 1/1000 d'em, moyenne entre Times et Helvetica. C'est une
    // approximation : les proportions relatives (i, l, t étroits ; m, w larges ;
    // capitales plus larges) suffisent à faire tomber les lignes à peu près
    // aux mêmes endroits quelle que soit la police.

    var TIMES_LOWER = [444, 500, 444, 500, 444, 333, 500, 500, 278, 278, 500, 278, 778,
                       500, 500, 500, 500, 333, 389, 278, 500, 500, 722, 500, 500, 444];
    var HELV_LOWER  = [556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833,
                       556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500];
    var TIMES_UPPER = [722, 667, 667, 722, 611, 556, 722, 722, 333, 389, 722, 611, 889,
                       722, 722, 556, 722, 667, 556, 611, 722, 722, 944, 722, 722, 611];
    var HELV_UPPER  = [667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833,
                       722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611];

    var widthLower = [];
    var widthUpper = [];
    for (var wi = 0; wi < 26; wi++) {
        widthLower[wi] = (TIMES_LOWER[wi] + HELV_LOWER[wi]) / 2;
        widthUpper[wi] = (TIMES_UPPER[wi] + HELV_UPPER[wi]) / 2;
    }

    // Lettres accentuées -> lettre de base
    var ACCENTS = {
        "\u00E0": "a", "\u00E1": "a", "\u00E2": "a", "\u00E3": "a", "\u00E4": "a", "\u00E5": "a",
        "\u00E7": "c",
        "\u00E8": "e", "\u00E9": "e", "\u00EA": "e", "\u00EB": "e",
        "\u00EC": "i", "\u00ED": "i", "\u00EE": "i", "\u00EF": "i",
        "\u00F1": "n",
        "\u00F2": "o", "\u00F3": "o", "\u00F4": "o", "\u00F5": "o", "\u00F6": "o", "\u00F8": "o",
        "\u00F9": "u", "\u00FA": "u", "\u00FB": "u", "\u00FC": "u",
        "\u00FD": "y", "\u00FF": "y",
        "\u00E6": "ae", "\u0153": "oe"
    };

    var APOS_CHARS = "'\u2018\u2019\u02BC";   // les vrais caract\u00E8res, pas la source de regex
    var WIDTH_DIGIT = 500;
    var WIDTH_APOS = 250;      // apostrophe
    var WIDTH_PUNCT = 250;     // virgule ou point dans un nombre
    var WIDTH_OTHER = 500;

    function letterWidth(ch, upper) {
        var code = ch.charCodeAt(0);
        if (code >= 97 && code <= 122) { return upper ? widthUpper[code - 97] : widthLower[code - 97]; }
        return WIDTH_OTHER;
    }

    function charWidth(ch) {
        var code = ch.charCodeAt(0);
        if (code >= 48 && code <= 57) { return WIDTH_DIGIT; }
        if (code >= 65 && code <= 90) { return widthUpper[code - 65]; }
        if (code >= 97 && code <= 122) { return widthLower[code - 97]; }
        if (ch === "," || ch === ".") { return WIDTH_PUNCT; }
        var lower = ch.toLowerCase();
        var base = ACCENTS[lower];
        if (base !== undefined) {
            var isUpper = (ch !== lower);
            var total = 0;
            for (var b = 0; b < base.length; b++) { total += letterWidth(base.charAt(b), isUpper && b === 0); }
            return total;
        }
        if (APOS_CHARS.indexOf(ch) !== -1) { return WIDTH_APOS; }
        return WIDTH_OTHER;
    }

    function textWidth(str) {
        var total = 0;
        for (var i = 0; i < str.length; i++) { total += charWidth(str.charAt(i)); }
        return total;
    }


    // Vocabulaire dédupliqué, puis index trié par largeur pour chaque casse.
    var vocabulary = [];
    (function () {
        var seen = {};
        for (var i = 0; i < latinWords.length; i++) {
            var words = latinWords[i].split(/\s+/);
            for (var j = 0; j < words.length; j++) {
                var w = words[j];
                if (w && !seen[w]) { seen[w] = true; vocabulary.push(w); }
            }
        }
    })();

    function applyCaseMode(word, mode) {
        if (mode === "upper") { return word.toUpperCase(); }
        if (mode === "cap") { return word.charAt(0).toUpperCase() + word.substring(1); }
        return word;
    }

    var indexes = {};
    function getIndex(mode) {
        if (indexes[mode]) { return indexes[mode]; }
        var list = [];
        for (var i = 0; i < vocabulary.length; i++) {
            var form = applyCaseMode(vocabulary[i], mode);
            list.push({ txt: form, width: textWidth(form) });
        }
        list.sort(function (a, b) { return a.width - b.width; });
        indexes[mode] = list;
        return list;
    }

    // Casse du mot d'origine : "upper" (CAPITALES), "cap" (Initiale) ou "lower".
    function caseMode(original) {
        var upper = original.toUpperCase();
        var lower = original.toLowerCase();
        if (original.length > 1 && original === upper && original !== lower) { return "upper"; }
        var first = original.charAt(0);
        if (first === first.toUpperCase() && first !== first.toLowerCase()) { return "cap"; }
        return "lower";
    }

    // \u00C9cart cumul\u00E9 (largeur latine - largeur d'origine) : chaque mot vise
    // la largeur d'origine MOINS l'\u00E9cart d\u00E9j\u00E0 accumul\u00E9, donc les erreurs se
    // compensent au lieu de s'additionner le long du paragraphe.
    var drift = 0;

    var recent = [];            // derniers mots employ\u00E9s, pour \u00E9viter les r\u00E9p\u00E9titions
    var RECENT_MAX = 8;

    function isRecent(txt) {
        for (var i = 0; i < recent.length; i++) { if (recent[i] === txt) { return true; } }
        return false;
    }

    function remember(txt) {
        recent.push(txt);
        if (recent.length > RECENT_MAX) { recent.shift(); }
    }

    // Choisit un mot latin de largeur proche de celle du mot d'origine.
    function pickByWidth(original, isWord) {
        var mode = isWord ? caseMode(original) : "lower";
        var original_width = textWidth(original);
        var target = original_width - drift;
        if (target < original_width * 0.5) { target = original_width * 0.5; }
        if (target > original_width * 1.5) { target = original_width * 1.5; }
        var list = getIndex(mode);

        // recherche dichotomique de la largeur la plus proche
        var lo = 0, hi = list.length - 1;
        while (lo < hi) {
            var mid = (lo + hi) >> 1;
            if (list[mid].width < target) { lo = mid + 1; } else { hi = mid; }
        }
        var nearest = lo;
        if (nearest > 0 && Math.abs(list[nearest - 1].width - target) < Math.abs(list[nearest].width - target)) {
            nearest--;
        }
        var bestError = Math.abs(list[nearest].width - target);

        // mot trop long pour la banque : mot généré de même longueur
        if (bestError > target * 0.25) {
            var generated = applyCaseMode(generateWord(original.length), mode);
            drift += textWidth(generated) - original_width;
            return generated;
        }

        // candidats : tout ce qui est à +/- 2,5 % (ou aussi près que le meilleur)
        var tolerance = Math.max(bestError, target * 0.025);
        var candidates = [];
        var k = nearest;
        while (k >= 0 && target - list[k].width <= tolerance && candidates.length < 14) {
            candidates.push(list[k].txt); k--;
        }
        k = nearest + 1;
        while (k < list.length && list[k].width - target <= tolerance && candidates.length < 14) {
            candidates.push(list[k].txt); k++;
        }

        var fresh = [];
        for (var c = 0; c < candidates.length; c++) {
            if (!isRecent(candidates[c])) { fresh.push(candidates[c]); }
        }
        var pool = fresh.length > 0 ? fresh : candidates;
        var chosen = pool[Math.floor(random() * pool.length)];
        remember(chosen);
        drift += textWidth(chosen) - original_width;
        return chosen;
    }


    // ---------------------------------------------------------
    // 6. Découpage en mots et nombres
    // ---------------------------------------------------------

    // Lettres latines (accents inclus) en \u : A-Z a-z À-Ö Ø-ö ø-ſ
    var LETTERS = "A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u017F";
    // Un mot peut contenir des apostrophes (d'affaires, l'\u00E9t\u00E9, aujourd'hui) :
    // il est alors remplac\u00E9 en bloc par UN mot latin de m\u00EAme chasse.
    var APOS = "'\\u2018\\u2019\\u02BC";
    var tokenRegex = new RegExp(
        "([0-9]+(?:[.,][0-9]+)*)|([" + LETTERS + "]+(?:[" + APOS + "][" + LETTERS + "]+)*)|(\\u20AC)|([ \\t\\u00A0\\u202F\\u2009]*%)|([ \\t\\u00A0]*\\n[ \\t\\u00A0]*)",
        "g"
    );

    function buildJobs(sourceText) {
        var jobs = [];
        var m;
        drift = 0;
        tokenRegex.lastIndex = 0;
        while ((m = tokenRegex.exec(sourceText)) !== null) {
            var token = m[0];
            if (m[4] !== undefined) {
                // pourcentage (avec l'espace qui le pr\u00E9c\u00E8de) : supprim\u00E9
                jobs.push({ pos: m.index, len: token.length, txt: "" });
                continue;
            }
            if (m[5] !== undefined) {
                // retour forc\u00E9 (Maj+Entr\u00E9e) : devient une simple espace, car les mots
                // latins ne chassent pas comme les mots d'origine et le saut deviendrait faux
                jobs.push({ pos: m.index, len: token.length, txt: " " });
                continue;
            }
            var latin;
            if (m[3] !== undefined) {
                // symbole euro : une seule lettre
                var letters = ["a", "e", "o"];
                latin = letters[Math.floor(random() * letters.length)];
            } else {
                latin = pickByWidth(token, m[2] !== undefined);
            }
            if (latin !== token) {
                jobs.push({ pos: m.index, len: token.length, txt: latin });
            }
        }
        return jobs;
    }


    // ---------------------------------------------------------
    // 7. Sélection -> liste de plages de texte
    // ---------------------------------------------------------

    function hasTextRange(obj) {
        try {
            return typeof obj.contents === "string" && obj.parentStory !== undefined && obj.parentStory !== null;
        } catch (e) {
            return false;
        }
    }

    function collectRanges(selection) {
        var ranges = [];
        var skipped = 0;

        for (var i = 0; i < selection.length; i++) {
            var sel = selection[i];
            var kind = "";
            try { kind = sel.constructor.name; } catch (e) {}

            try {
                if (kind === "TextFrame" || kind === "Cell" || kind === "Story") {
                    ranges.push(sel.texts[0]);
                } else if (kind === "Table") {
                    var cells = sel.cells.everyItem().texts.everyItem().getElements();
                    for (var c = 0; c < cells.length; c++) { ranges.push(cells[c]); }
                } else if (hasTextRange(sel)) {
                    ranges.push(sel);
                } else {
                    skipped++;
                }
            } catch (e2) {
                skipped++;
            }
        }
        return { ranges: ranges, skipped: skipped };
    }


    // ---------------------------------------------------------
    // 8. Remplacement en place
    // ---------------------------------------------------------

    // Renvoie le nombre de mots remplacés, ou -1 si la plage est jugée
    // incohérente (le texte et les index InDesign ne correspondent pas).
    function replaceInRange(range) {
        var sourceText = range.contents;
        if (typeof sourceText !== "string" || sourceText.length === 0) { return 0; }

        var story = range.parentStory;
        var base = range.insertionPoints[0].index;

        // Garde-fou : la chaîne lue et les index du texte doivent coïncider
        // (sinon : tableau imbriqué, caractères hors BMP... on ne touche à rien).
        if (range.characters.length !== sourceText.length) { return -1; }

        var jobs = buildJobs(sourceText);

        // De la fin vers le début : les suppressions (pourcentages) ne décalent
        // ainsi jamais les index des remplacements restant à faire.
        for (var k = jobs.length - 1; k >= 0; k--) {
            var j = jobs[k];
            story.characters.itemByRange(base + j.pos, base + j.pos + j.len - 1).contents = j.txt;
        }
        return jobs.length;
    }


    // ---------------------------------------------------------
    // 9. Exécution (un seul Annuler pour tout)
    // ---------------------------------------------------------

    var found = collectRanges(app.selection);

    if (found.ranges.length === 0) {
        alert("La s\u00E9lection ne contient pas de texte exploitable.\n\nS\u00E9lectionnez un cadre de texte, ou du texte avec l'outil Texte.");
        return;
    }

    var total = 0;
    var inconsistent = 0;
    var errors = [];

    try {
        app.doScript(
            function () {
                for (var i = 0; i < found.ranges.length; i++) {
                    try {
                        var n = replaceInRange(found.ranges[i]);
                        if (n < 0) { inconsistent++; } else { total += n; }
                    } catch (e) {
                        errors.push(e.message);
                    }
                }
            },
            ScriptLanguage.JAVASCRIPT,
            undefined,
            UndoModes.ENTIRE_SCRIPT,
            "G\u00E9n\u00E9rer un faux texte latin"
        );
    } catch (error) {
        alert("Une erreur est survenue pendant le remplacement du texte :\n\n" + error.message);
        return;
    }

    var report = [];
    if (inconsistent > 0) {
        report.push(inconsistent + " zone(s) ignor\u00E9e(s) : texte avec tableau imbriqu\u00E9 ou caract\u00E8res sp\u00E9ciaux dont les index ne correspondent pas.");
    }
    if (errors.length > 0) {
        report.push(errors.length + " erreur(s) : " + errors[0]);
    }
    if (found.skipped > 0) {
        report.push(found.skipped + " \u00E9l\u00E9ment(s) s\u00E9lectionn\u00E9(s) sans texte, ignor\u00E9(s).");
    }
    if (report.length > 0) {
        alert(report.join("\n\n"));
    }

})();
