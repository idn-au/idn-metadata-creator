<script setup>
import { ref, computed, watch, onMounted, nextTick, inject } from "vue";
import { DataFactory } from "n3";
import { v4 as uuid4 } from "uuid";
import { faChevronDown, faChevronUp, faXmark, faCircle as faCircleSolid, faFileImport, faChevronLeft, faChevronRight, faPlus, faPencil, faExclamation, faInfo, faTrash, faCircleNotch, faFloppyDisk, faFileExport, faDeleteLeft } from "@fortawesome/free-solid-svg-icons";
import { faCircle as faCircleRegular } from "@fortawesome/free-regular-svg-icons";
import { FormInput, FormField, BaseModal } from "@idn-au/idn-lib";
import { useRdfStore } from "@/composables/rdfStore";
import { useGetRequest } from "@/composables/api";
import { useBtnTimeout } from "@/composables/btnTimeout";
import propDetails from "@/util/props.json";
import exampleData from "@/util/exampleData";
import formOptions from "@/util/formOptions";
import tutorialContent from "@/util/tutorialContent";
import { fair, care } from "@/util/scoreData";
import { setRequirement, calculateScoreMax, calculateScore, setPrerequisite, hasFullScore, calculateSubScore } from "@/util/helpers";
import CustomAgentForm from "@/components/CustomAgentForm.vue";
import PropTooltip from "@/components/PropTooltip.vue";
import FormSection from "@/components/FormSection.vue";
import RDFPreview from "@/components/RDFPreview.vue";
import FairScore from "@/components/scores/FairScore.vue";
import CareScore from "@/components/scores/CareScore.vue";

const { namedNode, literal } = DataFactory;

const ROLES_VOCAB = "https://linked.data.gov.au/def/data-roles";
const LICENSE_VOCAB = "https://linked.data.gov.au/def/licenses";
const ACCESS_RIGHTS_VOCAB = "https://linked.data.gov.au/def/data-access-rights";
const THEMES_VOCAB = "https://data.idnau.org/pid/vocab/idn-th";
const DATA_INDIGENEITY_VOCAB = "https://data.idnau.org/pid/vocab/indigeneity";
const ORG_INDIGENEITY_VOCAB = "https://data.idnau.org/pid/vocab/org-indigeneity";

const useRemoteOptions = true;

const defaultIri = `https://data.idnau.org/pid/resource/${uuid4()}`;

const rdfFormats = {
    "ttl": "text/turtle",
    "trig": "application/trig",
    "nt": "application/n-triples",
    "n3": "text/n3",
};

const idgOptions = [
    {
        label: "Yes",
        value: "true"
    },
    {
        label: "No",
        value: "false"
    }
];

const agentNamedGraph = inject("agentNamedGraph");
const triplestoreUrl = inject("triplestoreUrl");

const emptyData = {
    iri: "",
    assignIri: true,
    title: "",
    indigeneity: [],
    description: "",
    created: "",
    modified: "",
    issued: "",
    license: "",
    useCustomLicense: false,
    customLicense: "",
    rights: "",
    accessRights: "",
    spatialGeom: "",
    useSpatialIri: false,
    spatialIri: "",
    temporalStart: "",
    temporalEnd: "",
    accessUrl: "",
    agentRoles: [
        {
            agent: "",
            role: [],
            useCustomAgent: false,
            customAgent: {
                iri: "",
                isPerson: false,
                name: "",
                description: "",
                url: "",
                identifiers: [
                    {
                        value: "",
                        datatype: ""
                    }
                ],
                indigeneity: "",
                review: false
            },
            idg: {
                exists: "",
                public: "",
                url: "",
                desc: ""
            }
        }
    ],
    themes: [],
    contactName: "",
    contactEmail: "",
    contactPhone: ""
};

const { store, qname, serialize } = useRdfStore();

const { data: agentData, loading: agentLoading, error: agentError, doSparqlGetQuery: agentDoSparqlGetQuery, doSparqlPostQuery: agentDoSparqlPostQuery } = useGetRequest();
const { data: roleData, loading: roleLoading, error: roleError, doSparqlGetQuery: roleDoSparqlGetQuery, doSparqlPostQuery: roleDoSparqlPostQuery } = useGetRequest();
const { data: licenseData, loading: licenseLoading, error: licenseError, doSparqlGetQuery: licenseDoSparqlGetQuery, doSparqlPostQuery: licenseDoSparqlPostQuery } = useGetRequest();
const { data: accessRightsData, loading: accessRightsLoading, error: accessRightsError, doSparqlGetQuery: accessRightsDoSparqlGetQuery, doSparqlPostQuery: accessRightsDoSparqlPostQuery } = useGetRequest();
const { data: themeData, loading: themeLoading, error: themeError, doSparqlGetQuery: themeDoSparqlGetQuery, doSparqlPostQuery: themeDoSparqlPostQuery } = useGetRequest();
const { data: indigeneityData, loading: indigeneityLoading, error: indigeneityError, doSparqlGetQuery: indigeneityDoSparqlGetQuery, doSparqlPostQuery: indigeneityDoSparqlPostQuery } = useGetRequest();
const { data: agentIndigeneityData, loading: agentIndigeneityLoading, error: agentIndigeneityError, doSparqlGetQuery: agentIndigeneityDoSparqlGetQuery, doSparqlPostQuery: agentIndigeneityDoSparqlPostQuery } = useGetRequest();

const agentOptionsRequested = ref([]);
const roleOptionsRequested = ref([]);
const licenseOptionsRequested = ref([]);
const accessRightsOptionsRequested = ref([]);
const themeOptionsRequested = ref([]);
const indigeneityOptionsRequested = ref([]);
const agentIndigeneityOptionsRequested = ref([]);

const { clicked: savedDraft, startTimeout: startSavedDraftTimeout } = useBtnTimeout();
const { clicked: deletedDraft, startTimeout: startDeletedDraftTimeout } = useBtnTimeout();
const { clicked: clearedData, startTimeout: startClearedDataTimeout } = useBtnTimeout();

const spatialBnode = store.value.createBlankNode(); // _:b0
const temporalBnode = store.value.createBlankNode(); // _:b1
const distributionBnode = store.value.createBlankNode(); // _:b2

const showRDF = ref(false);
const loading = ref({
    accessUrl: false
});
// const urlProtocol = ref("");
const data = ref({
    iri: "",
    assignIri: true,
    title: "",
    indigeneity: [],
    description: "",
    created: "",
    modified: "",
    issued: "",
    license: "",
    useCustomLicense: false,
    customLicense: "",
    rights: "",
    accessRights: "",
    spatialGeom: "",
    useSpatialIri: false,
    spatialIri: "",
    temporalStart: "",
    temporalEnd: "",
    accessUrl: "",
    agentRoles: [
        {
            agent: "",
            role: [],
            useCustomAgent: false,
            customAgent: {
                iri: "",
                isPerson: false,
                name: "",
                description: "",
                url: "",
                identifiers: [
                    {
                        value: "",
                        datatype: ""
                    }
                ],
                indigeneity: "",
                review: false
            },
            idg: {
                exists: "",
                public: "",
                url: "",
                desc: ""
            }
        }
    ],
    themes: [],
    contactName: "",
    contactEmail: "",
    contactPhone: ""
});

const declarationTicked = ref(false);

const tutorialEnabled = ref(false);
const tutorialStep = ref(0); // 1-max, 0 is invalid
const tutorialTotalSteps = 10;
const tutorialFocus = ref({
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
    7: null,
    8: null,
    9: null,
    10: null,
}); // HTML element ref for getting element positioning

const activeExample = ref("");

const sectionRefs = ref({
    general: null,
    agent: null,
    dates: null,
    rights: null,
    spatial: null,
    distribution: null,
    theme: null,
    contact: null
});

const sectionCollapsed = ref({
    general: false,
    agent: true,
    dates: true,
    rights: true,
    spatial: true,
    distribution: true,
    theme: true,
    contact: true
});

const showPropTooltips = ref(false);

const validation = ref({}); // { key: isValid, ... }

const isValid = computed(() => {
    return Object.values(validation.value).every(Boolean);
});

const allOpen = computed(() => {
    return Object.values(sectionCollapsed.value).every(val => val !== true);
});

function handleValidate(key, isValid) {
    validation.value[key] = isValid;
}

const serializedData = ref("");
const modal = ref(null);
const hasSavedDraft = ref(false);

const calcIri = computed(() => {
    return data.value.assignIri ? defaultIri : data.value.iri;
});

const calcGeometry = computed(() => {
    return data.value.useSpatialIri ? data.value.spatialIri : data.value.spatialGeom;
});

const calcLicense = computed(() => {
    return data.value.useCustomLicense ? data.value.customLicense : data.value.license;
});

const empty = computed(() => {
    // return Object.values(data.value).filter(item => typeof(item) !== "boolean" && item.length > 0).length === 0;
    return JSON.stringify(data.value) === JSON.stringify(emptyData);
});

const minData = computed(() => {
    // iri, title, created, modified
    return !(calcIri.value === "" || data.value.title === "" || data.value.created === "" || data.value.modified === "");
});

const usingCustomAgents = computed(() => {
    return !data.value.agentRoles.every(agentRole => agentRole.useCustomAgent === false);
});

// TODO: revise score logic & check prerequisites refer to scores that have been precalculated
// scores
const fairScore = computed(() => {
    const computedFair = {...fair};
    calculateScoreMax(computedFair);
    
    // F1
    // has an ID
    setRequirement(computedFair, ["f", "f1"], 0, calcIri.value !== "");
    // ID is URL
    setRequirement(computedFair, ["f", "f1"], 1, calcIri.value !== "");
    // ID is globally unique, citeable & persistent (is DOI, etc.?)
    setRequirement(computedFair, ["f", "f1"], 2, [
        "doi:",
        "doi.org",
        "ark:",
        "purl.org",
        "linked.data.gov.au",
        "handle.net",
        "w3id.org",
    ].some(x => calcIri.value.includes(x)));

    // F2
    // has title & desc
    setRequirement(computedFair, ["f", "f2"], 0, data.value.title !== "" && data.value.description !== "");
    // any other dcterms props set
    setRequirement(computedFair, ["f", "f2"], 1, [
        data.value.indigeneity.some(i => i !== ""),
        data.value.created !== "",
        data.value.modified !== "",
        data.value.issued !== "",
        calcLicense.value !== "",
        data.value.rights !== "",
        data.value.accessRights !== "",
        calcGeometry.value !== "",
        data.value.temporalStart !== "",
        data.value.temporalEnd !== "",
    ].some(p => p));
    // all recommended props are set - title, description, created, modified, type qualifiedAttribution
    setRequirement(computedFair, ["f", "f2"], 2, [
        data.value.title !== "",
        data.value.description !== "",
        data.value.created !== "",
        data.value.modified !== "",
        data.value.agentRoles.length > 0
    ].every(p => p));

    // F3
    setRequirement(computedFair, ["f", "f3"], 0, calcIri.value !== "");

    // F4
    // dcterms:isPartOf? metadata in catalogue? or use dcat:accessURL?
    // setRequirement(computedFair, ["f", "f4"], 0, calcIri.value !== "");
    // setRequirement(computedFair, ["f", "f4"], 1, calcIri.value !== "");

    // A1
    setRequirement(computedFair, ["a", "a1"], 0, [
        `${ACCESS_RIGHTS_VOCAB}/metadata-only`,
        `${ACCESS_RIGHTS_VOCAB}/conditional`,
        `${ACCESS_RIGHTS_VOCAB}/embargoed`,
        `${ACCESS_RIGHTS_VOCAB}/open`
    ].some(p => data.value.accessRights === p));
    setRequirement(computedFair, ["a", "a1"], 1, [
        `${ACCESS_RIGHTS_VOCAB}/conditional`,
        `${ACCESS_RIGHTS_VOCAB}/embargoed`,
        `${ACCESS_RIGHTS_VOCAB}/open`
    ].some(p => data.value.accessRights === p));
    setRequirement(computedFair, ["a", "a1"], 2, [
        `${ACCESS_RIGHTS_VOCAB}/embargoed`,
        `${ACCESS_RIGHTS_VOCAB}/open`
    ].some(p => data.value.accessRights === p));
    setRequirement(computedFair, ["a", "a1"], 3, [
        `${ACCESS_RIGHTS_VOCAB}/open`
    ].some(p => data.value.accessRights === p));

    // A2
    // record available if data is no longer available - can't test

    // I1
    // structured, machine-readable - in RDF
    setRequirement(computedFair, ["i", "i1"], 0, true);
    setRequirement(computedFair, ["i", "i1"], 1, true);

    // I2
    // data has been described - ?
    setRequirement(computedFair, ["i", "i2"], 0, true);
    // uses reference vocabs - true due to the form using vocabs?
    setRequirement(computedFair, ["i", "i2"], 1, true);
    // vocab references use global ids - true because rdf vocabs use IRIs?
    setRequirement(computedFair, ["i", "i2"], 2, true);

    // I3
    // links to other metadata - ?
    setRequirement(computedFair, ["i", "i3"], 0, true);
    // machine-readable - always for rdf
    setRequirement(computedFair, ["i", "i3"], 1, true);

    // R1
    // R1.1
    // has a license
    setRequirement(computedFair, ["r", "r1", "r1.1"], 0, calcLicense.value !== "");

    // R1.2
    // has prov - check prov: props? - prov:startedAtTime, prov:endedAtTime, prov:qualifiedAttribution, prov:agent
    setRequirement(computedFair, ["r", "r1", "r1.2"], 0, [
        data.value.temporalStart !== "",
        data.value.temporalEnd !== "",
        data.value.agentRoles.length > 0
    ].some(p => p));

    // R1.3
    // has a data source - dcat:accessURL? or dcterms:source (not used here)?
    // data source has prov

    calculateScore(computedFair);
    
    return computedFair;
});

const careScore = computed(() => {
    const computedCare = {...care};
    calculateScoreMax(computedCare);

    // C1
    // has an IRI
    setRequirement(computedCare, ["c", "c1"], 0, calcIri.value !== "");
    // indigineity is set
    setRequirement(computedCare, ["c", "c1"], 1, data.value.indigeneity.length > 0);
    // access rights set
    setRequirement(computedCare, ["c", "c1"], 2, data.value.accessRights !== "");
    calculateSubScore(computedCare, ["c", "c1"]); // needed if prerequisites depend on this score
    
    // C2
    setPrerequisite(computedCare, ["c", "c2"], hasFullScore(computedCare, ["c", "c1"]));
    // IRI resolves
    setRequirement(computedCare, ["c", "c2"], 0, calcIri.value !== ""); // need to check IRI resolves
    // title exists
    setRequirement(computedCare, ["c", "c2"], 1, data.value.title !== "");
    // description exists
    setRequirement(computedCare, ["c", "c2"], 2, data.value.description !== "");
    // custodian has indigeneity
    setRequirement(computedCare, ["c", "c2"], 3, data.value.agentRoles.some(x => x.role.includes(`${ROLES_VOCAB}/custodian`) && [
        `${ORG_INDIGENEITY_VOCAB}/indigenous-persons-organisation`,
        `${ORG_INDIGENEITY_VOCAB}/owned-by-indigenous-persons`,
        `${ORG_INDIGENEITY_VOCAB}/run-by-indigenous-persons`
    ].includes(x.agent.indigeneity)));
    calculateSubScore(computedCare, ["c", "c2"]);

    // C3
    setPrerequisite(computedCare, ["c", "c3"], hasFullScore(computedCare, ["c", "c2"]));
    // has license, rights & agent with role Rights Holder
    setRequirement(computedCare, ["c", "c3"], 0, calcLicense.value !== "" && data.value.rights !== "" && data.value.agentRoles.some(x => x.role.includes(`${ROLES_VOCAB}/rightsHolder`)));
    // has distribution
    setRequirement(computedCare, ["c", "c3"], 1, data.value.accessUrl !== "");
    calculateSubScore(computedCare, ["c", "c3"]);

    // A1
    // custodian has indigeneity
    setRequirement(computedCare, ["a", "a1"], 0, data.value.agentRoles.some(x => x.role.includes(`${ROLES_VOCAB}/custodian`) && [
        `${ORG_INDIGENEITY_VOCAB}/indigenous-persons-organisation`,
        `${ORG_INDIGENEITY_VOCAB}/owned-by-indigenous-persons`,
        `${ORG_INDIGENEITY_VOCAB}/run-by-indigenous-persons`
    ].includes(x.agent.indigeneity)));
    // has license, rights & agent with role Rights Holder
    setRequirement(computedCare, ["a", "a1"], 1, calcLicense.value !== "" && data.value.rights !== "" && data.value.agentRoles.some(x => x.role.includes(`${ROLES_VOCAB}/rightsHolder`)));
    calculateSubScore(computedCare, ["a", "a1"]);

    // A2
    setPrerequisite(computedCare, ["a", "a2"], hasFullScore(computedCare, ["a", "a1"]));
    // IDG framework exists (on any agent?)
    setRequirement(computedCare, ["a", "a2"], 0, data.value.agentRoles.some(x => x.idg.url !== "" || x.idg.desc !== ""));
    // agent with IDG framework has role Custodian
    setRequirement(computedCare, ["a", "a2"], 1, data.value.agentRoles.some(x => x.idg.exists === "true" && x.role.includes(`${ROLES_VOCAB}/custodian`)));
    calculateSubScore(computedCare, ["a", "a2"]);

    // A3
    setPrerequisite(computedCare, ["a", "a3"], hasFullScore(computedCare, ["a", "a2"]));
    // data indigeneity = by indigenous people
    setRequirement(computedCare, ["a", "a3"], 0, data.value.indigeneity === `${DATA_INDIGENEITY_VOCAB}/by-indigenous-people`);
    // IDG framework has a URL
    setRequirement(computedCare, ["a", "a3"], 0, data.value.agentRoles.some(x => x.idg.exists === "true" && x.idg.url !== ""));
    calculateSubScore(computedCare, ["a", "a3"]);

    // R1
    // data indigeneity = by indigenous people
    setRequirement(computedCare, ["r", "r1"], 0, data.value.indigeneity !== `${DATA_INDIGENEITY_VOCAB}/by-indigenous-people`);
    // custodian has indigeneity
    setRequirement(computedCare, ["r", "r1"], 0, data.value.agentRoles.some(x => x.role.includes(`${ROLES_VOCAB}/custodian`) && [
        `${ORG_INDIGENEITY_VOCAB}/indigenous-persons-organisation`,
        `${ORG_INDIGENEITY_VOCAB}/owned-by-indigenous-persons`,
        `${ORG_INDIGENEITY_VOCAB}/run-by-indigenous-persons`
    ].includes(x.agent.indigeneity)));
    calculateSubScore(computedCare, ["r", "r1"]);

    // R2
    setPrerequisite(computedCare, ["r", "r2"], hasFullScore(computedCare, ["r", "r1"]));
    // Custodian has resolvable IDG framework URL or desc
    setRequirement(computedCare, ["r", "r2"], 0, data.value.agentRoles.some(x => x.idg.exists === "true" && ((x.idg.url !== "") || x.idg.desc !== "")));

    // R3
    setPrerequisite(computedCare, ["r", "r3"], hasFullScore(computedCare, ["r", "r1"]));
    // C3 has scored fully
    setRequirement(computedCare, ["r", "r3"], 0, hasFullScore(computedCare, ["c", "c3"]));
    // custodian has resolvable url for IDG
    setRequirement(computedCare, ["r", "r3"], 1, data.value.agentRoles.some(x => x.idg.exists === "true" && x.role.includes(`${ROLES_VOCAB}/custodian`)));
    // has spatial
    setRequirement(computedCare, ["r", "r3"], 2, calcGeometry.value !== "");
    // at least 2 themes selected
    setRequirement(computedCare, ["r", "r3"], 3, data.value.themes.length > 1);
    calculateSubScore(computedCare, ["r", "r3"]);

    // E1
    // C3 has scored fully
    setRequirement(computedCare, ["e", "e1"], 0, hasFullScore(computedCare, ["c", "c3"]));
    // A1 has scored fully
    setRequirement(computedCare, ["e", "e1"], 1, hasFullScore(computedCare, ["a", "a1"]));
    calculateSubScore(computedCare, ["e", "e1"]);

    // E2
    setPrerequisite(computedCare, ["e", "e2"], hasFullScore(computedCare, ["e", "e1"]));
    // A3 has scored fully
    setRequirement(computedCare, ["e", "e2"], 0, hasFullScore(computedCare, ["a", "a3"]));
    // custodian has indigeneity = indigenous persons organisation
    setRequirement(computedCare, ["r", "r1"], 0, data.value.agentRoles.some(x => x.role.includes(`${ROLES_VOCAB}/custodian`) && x.agent.indigeneity === `${ORG_INDIGENEITY_VOCAB}/indigenous-persons-organisation`));

    // E3
    setPrerequisite(computedCare, ["e", "e3"], hasFullScore(computedCare, ["e", "e1"]) && hasFullScore(computedCare, ["r", "r3"]));
    // created & modified exist
    setRequirement(computedCare, ["e", "e3"], 0, data.value.created !== "" && data.value.modified !== "");
    // name & point of contact exist
    setRequirement(computedCare, ["e", "e3"], 1, data.value.contactName !== "" && (data.value.contactEmail !== "" || data.value.contactPhone !== ""));

    calculateScore(computedCare);
    
    return computedCare;
});

watch(serializedData, (newValue, oldValue) => {
    if (activeExample.value) {
        if (newValue !== oldValue) {
            if (newValue !== exampleData[activeExample.value]) {
                activeExample.value = "";
            }
        }
    }
});

watch(calcIri, (newValue, oldValue) => {
    const quads = store.value.getQuads(namedNode(oldValue), null, null);
    store.value.removeQuads(quads);
    quads.forEach(q => {
        store.value.addQuad(namedNode(newValue), q.predicate, q.object);
    });
    serializedData.value = serialize();
});

watch(() => data.value.title, (newValue, oldValue) => {
    updateTriple(newValue, "dcterms:title", literal(newValue, namedNode(qname("xsd:string"))));
});

watch(() => data.value.indigeneity, (newValue, oldValue) => {
    const indigeneityQuads = store.value.getQuads(namedNode(calcIri.value), namedNode(qname("dcat:theme")), null);
    store.value.removeQuads(indigeneityQuads);
    if (newValue.length > 0) {
        newValue.forEach(indigeneity => store.value.addQuad(namedNode(calcIri.value), namedNode(qname("dcat:theme")), namedNode(indigeneity)));
    }
    serializedData.value = serialize();
});

watch(() => data.value.description, (newValue, oldValue) => {
    updateTriple(newValue, "dcterms:description", literal(newValue, namedNode(qname("xsd:string"))));
});

watch(() => data.value.created, (newValue, oldValue) => {
    updateTriple(newValue, "dcterms:created", literal(newValue, namedNode(qname("xsd:date"))));
});

watch(() => data.value.modified, (newValue, oldValue) => {
    updateTriple(newValue, "dcterms:modified", literal(newValue, namedNode(qname("xsd:date"))));
});

watch(() => data.value.issued, (newValue, oldValue) => {
    updateTriple(newValue, "dcterms:issued", literal(newValue, namedNode(qname("xsd:date"))));
});

watch(calcLicense, (newValue, oldValue) => {
    updateTriple(newValue, "dcterms:license", namedNode(newValue));
});

watch(() => data.value.rights, (newValue, oldValue) => {
    updateTriple(newValue, "dcterms:rights", literal(newValue, namedNode(qname("xsd:string"))));
});

watch(() => data.value.accessRights, (newValue, oldValue) => {
    updateTriple(newValue, "dcterms:accessRights", namedNode(newValue));
});

watch(calcGeometry, (newValue, oldValue) => {
    const spatialQuads = store.value.getQuads(namedNode(calcIri.value), namedNode(qname("dcterms:spatial")), null);
    if (spatialQuads.length > 0 && spatialQuads[0].object.termType === "BlankNode") {
        const bnodeQuads = store.value.getQuads(spatialQuads[0].object, null, null);
        store.value.removeQuads(bnodeQuads);
    }
    store.value.removeQuads(spatialQuads);

    if (data.value.useSpatialIri) {
        updateTriple(newValue, "dcterms:spatial", namedNode(newValue));
    } else {
        if (newValue !== "") {
            store.value.addQuad(namedNode(calcIri.value), namedNode(qname("dcterms:spatial")), spatialBnode);
            store.value.addQuad(spatialBnode, namedNode(qname("a")), namedNode(qname("geo:Geometry")));
            store.value.addQuad(spatialBnode, namedNode(qname("geo:asWKT")), literal(newValue, namedNode(qname("geo:wktLiteral"))));
        }

        serializedData.value = serialize();
    }
});

watch(() => data.value.temporalStart, (newValue, oldValue) => {
    const temporalQuads = store.value.getQuads(namedNode(calcIri.value), namedNode(qname("dcterms:temporal")), null);
    if (temporalQuads.length > 0 && temporalQuads[0].object.termType === "BlankNode") {
        const bnodeQuads1 = store.value.getQuads(temporalQuads[0].object, namedNode(qname("prov:startedAtTime")), null);
        store.value.removeQuads(bnodeQuads1);
        const bnodeQuads2 = store.value.getQuads(temporalQuads[0].object, null, null);
        if (bnodeQuads2.length === 0) {
            store.value.removeQuads(temporalQuads);
        }
    }

    if (newValue !== "") {
        // date datatype
        let datatype = "";
        const valueSplit = newValue.split("-")
        if (valueSplit.length === 1) {
            datatype = "xsd:gYear";
        } else if (valueSplit.length === 2) {
            datatype = "xsd:monthYear";
        } else {
            datatype = "xsd:date";
        }

        store.value.addQuad(namedNode(calcIri.value), namedNode(qname("dcterms:temporal")), temporalBnode);
        store.value.addQuad(temporalBnode, namedNode(qname("prov:startedAtTime")), literal(newValue, namedNode(qname(datatype))));
    }
    serializedData.value = serialize();
});

watch(() => data.value.temporalEnd, (newValue, oldValue) => {
    const temporalQuads = store.value.getQuads(namedNode(calcIri.value), namedNode(qname("dcterms:temporal")), null);
    if (temporalQuads.length > 0 && temporalQuads[0].object.termType === "BlankNode") {
        const bnodeQuads = store.value.getQuads(temporalQuads[0].object, namedNode(qname("prov:endedAtTime")), null);
        store.value.removeQuads(bnodeQuads);
        const bnodeQuads2 = store.value.getQuads(temporalQuads[0].object, null, null);
        if (bnodeQuads2.length === 0) {
            store.value.removeQuads(temporalQuads);
        }
    }

    if (newValue !== "") {
        // date datatype
        let datatype = "";
        const valueSplit = newValue.split("-")
        if (valueSplit.length === 1) {
            datatype = "xsd:gYear";
        } else if (valueSplit.length === 2) {
            datatype = "xsd:monthYear";
        } else {
            datatype = "xsd:date";
        }

        store.value.addQuad(namedNode(calcIri.value), namedNode(qname("dcterms:temporal")), temporalBnode);
        store.value.addQuad(temporalBnode, namedNode(qname("prov:endedAtTime")), literal(newValue, namedNode(qname(datatype))));
    }
    serializedData.value = serialize();
});

watch(() => data.value.accessUrl, (newValue, oldValue) => {
    const distQuads = store.value.getQuads(namedNode(calcIri.value), namedNode(qname("dcat:distribution")), null);
    if (distQuads.length > 0 && distQuads[0].object.termType === "BlankNode") {
        const bnodeQuads = store.value.getQuads(distQuads[0].object, null, null);
        store.value.removeQuads(bnodeQuads);
    }
    store.value.removeQuads(distQuads);

    if (newValue !== "") {
        store.value.addQuad(namedNode(calcIri.value), namedNode(qname("dcat:distribution")), distributionBnode);
        store.value.addQuad(distributionBnode, namedNode(qname("dcat:accessURL")), literal(newValue, namedNode(qname("xsd:anyURI"))));
    }

    serializedData.value = serialize();
});

watch(() => data.value.themes, (newValue, oldValue) => {
    const themeQuads = store.value.getQuads(namedNode(calcIri.value), namedNode(qname("dcat:theme")), null);
    store.value.removeQuads(themeQuads);
    if (newValue.length > 0) {
        newValue.forEach(theme => store.value.addQuad(namedNode(calcIri.value), namedNode(qname("dcat:theme")), namedNode(theme)));
    }
    serializedData.value = serialize();
});

watch(() => data.value.agentRoles, (newValue, oldValue) => {
    const qualifiedQuads = store.value.getQuads(namedNode(calcIri.value), namedNode(qname("prov:qualifiedAttribution")), null);
    if (qualifiedQuads.length > 0) {
        qualifiedQuads.forEach(q => {
            if (q.object.termType === "BlankNode") {
                const bnodeQuads2 = store.value.getQuads(q.object, null, null);
                bnodeQuads2.forEach(q2 => {
                    if (q2.object.termType === "NamedNode") {
                        const bnodeQuads3 = store.value.getQuads(q2.object, null, null);
                        store.value.removeQuads(bnodeQuads3);
                    }
                })
                store.value.removeQuads(bnodeQuads2);
            }
        });
        store.value.removeQuads(qualifiedQuads);
    }

    if (newValue && newValue.length > 0) {
        newValue.forEach((agentRole) => {
            if (agentRole.agent !== "" || (agentRole.useCustomAgent && agentRole.customAgent.iri !== "" && agentRole.customAgent.name !== "") || agentRole.role.length > 0) {
                const newBnode = store.value.createBlankNode();
                store.value.addQuad(namedNode(calcIri.value), namedNode(qname("prov:qualifiedAttribution")), newBnode);
                if (agentRole.useCustomAgent && agentRole.customAgent.iri !== "" && agentRole.customAgent.name !== "") {
                    store.value.addQuad(newBnode, namedNode(qname("prov:agent")), namedNode(agentRole.customAgent.iri));
                    store.value.addQuad(agentRole.customAgent.iri, namedNode(qname("sdo:name")), literal(agentRole.customAgent.name));
                    store.value.addQuad(agentRole.customAgent.iri, namedNode(qname("a")), namedNode(qname(`sdo:${agentRole.customAgent.isPerson ? "Person" : "Organization"}`)));
                    if (agentRole.customAgent.description !== "") {
                        store.value.addQuad(agentRole.customAgent.iri, namedNode(qname("sdo:description")), literal(agentRole.customAgent.description));
                    }
                    if (agentRole.customAgent.url !== "") {
                        store.value.addQuad(agentRole.customAgent.iri, namedNode(qname("sdo:url")), literal(agentRole.customAgent.url, namedNode(qname("xsd:anyURI"))));
                    }
                    if (agentRole.customAgent.identifiers.length > 0) {
                        agentRole.customAgent.identifiers.forEach(id => {
                            if (id.value !== "") {
                                store.value.addQuad(agentRole.customAgent.iri, namedNode(qname("sdo:identifier")), literal(id.value, namedNode(id.datatype)));
                            }
                        });
                    }
                    if (agentRole.customAgent.indigeneity !== "") {
                        store.value.addQuad(agentRole.customAgent.iri, namedNode(qname("dcterms:type")), namedNode(agentRole.customAgent.indigeneity));
                    }
                } else if (agentRole.agent !== "") {
                    store.value.addQuad(newBnode, namedNode(qname("prov:agent")), namedNode(agentRole.agent));
                }
                if (agentRole.role.length > 0) {
                    agentRole.role.forEach(role => {
                        store.value.addQuad(newBnode, namedNode(qname("dcat:hadRole")), namedNode(role));
                    });
                }
            }
        });
    }
    serializedData.value = serialize();
}, { deep: true });

// watch(
//     () => data.value.accessUrl,
//     (newValue, oldValue) => {
//         let protocol = newValue.split("://")[0];
//         if (!newValue.match(/\w+?:\/\//) && urlProtocol.value === "") {
//             urlProtocol.value = "http";
//         } else if (urlProtocolOptions.map(option => option.value).includes(newValue.split("://")[0])) {
//             urlProtocol.value = protocol;
//         }
//     }
// );

function updateTriple(value, predQname, object) {
    const quads = store.value.getQuads(namedNode(calcIri.value), namedNode(qname(predQname)), null);
    store.value.removeQuads(quads);
    if (value !== "") {
        store.value.addQuad(namedNode(calcIri.value), namedNode(qname(predQname)), object);
    }
    serializedData.value = serialize();
}

function validateMatchRegex(s, exp, invalidMessage) {
    if (s.match(exp)) {
        return [true, ""];
    } else {
        return [false, invalidMessage];
    }
}

function validateIri(s) {
    return validateMatchRegex(s, /^https?:\/\/.+/, "Invalid IRI");
}

function validateWktString(s) {
    return validateMatchRegex(s, /^\w+\s?\(.+\)$/, "Invalid WKT geometry");
}

function validateReachableUrl(s) {
    if (s !== "") {
        loading.value.accessUrl = true;

        fetch(s, {
            method: "HEAD",
            mode: "no-cors"
        })
        .catch(e => {
            return [false, "URL is unreachable"]
        });

        loading.value.accessUrl = false;
    }
}

function setFile(e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
        const extension = file.name.split(".")[1];
        loadRDF({ format: rdfFormats[extension], value: e.target.result })
    };
    reader.readAsText(file);
}

function loadRDF(e) {
    const { format, value } = e;
    const { store: loadedStore, qname: loadedQname, parseIntoStore: loadedParseIntoStore, serialize: loadedSerialize } = useRdfStore();
    clearData();
    loadedParseIntoStore(value, format);
    const subject = loadedStore.value.getSubjects(namedNode(qname("a")), namedNode(loadedQname("dcat:Resource")))[0];
    data.value.iri = subject.id;
    data.value.assignIri = false;
    loadedStore.value.forEach(q => { // get preds & objs
        if (q.predicate.value === loadedQname("dcterms:title")) {
            data.value.title = q.object.value;
        } else if (q.predicate.value === loadedQname("dcterms:type")) { //  ???
            data.value.indigeneity.push(q.object.value);
        } else if (q.predicate.value === loadedQname("dcterms:description")) {
            data.value.description = q.object.value;
        } else if (q.predicate.value === loadedQname("dcterms:created")) {
            data.value.created = q.object.value;
        } else if (q.predicate.value === loadedQname("dcterms:modified")) {
            data.value.modified = q.object.value;
        } else if (q.predicate.value === loadedQname("dcterms:issued")) {
            data.value.issued = q.object.value;
        } else if (q.predicate.value === loadedQname("dcterms:license")) {
            data.value.license = q.object.value;
        } else if (q.predicate.value === loadedQname("dcterms:rights")) {
            data.value.rights = q.object.value;
        } else if (q.predicate.value === loadedQname("dcterms:accessRights")) {
            data.value.accessRights = q.object.value;
        } else if (q.predicate.value === loadedQname("dcterms:spatial")) {
            if (q.object.termType === "NamedNode") {
                data.value.spatialIri = q.object.value;
            } else if (q.object.termType === "BlankNode") {
                const bnodes = loadedStore.value.getQuads(q.object, namedNode(loadedQname("geo:asWKT")), null);
                data.value.spatialGeom = bnodes[0].object.value;
            }
        } else if (q.predicate.value === loadedQname("dcterms:temporal")) {
            if (q.object.termType === "BlankNode") {
                loadedStore.value.forEach(q1 => {
                    if (q1.predicate.value === loadedQname("prov:startedAtTime")) {
                        data.value.temporalStart = q1.object.value;
                    } else if (q1.predicate.value === loadedQname("prov:endedAtTime")) {
                        data.value.temporalEnd = q1.object.value;
                    }
                }, q.object, null, null);
            }
        } else if (q.predicate.value === loadedQname("dcat:distribution")) {
            if (q.object.termType === "BlankNode") {
                const bnodes = loadedStore.value.getQuads(q.object, namedNode(loadedQname("dcat:accessURL")), null);
                data.value.accessUrl = bnodes[0].object.value;
            }
        } else if (q.predicate.value === loadedQname("dcat:theme")) {
            data.value.themes.push(q.object.value);
        } else if (q.predicate.value === loadedQname("prov:qualifiedAttribution")) {
            if (q.object.termType === "BlankNode") {
                let agentRole = {
                    agent: "",
                    role: [],
                    useCustomAgent: false,
                    customAgent: ""
                };
                loadedStore.value.forEach(q1 => {
                    if (q1.predicate.value === loadedQname("prov:agent")) {
                        if (agentOptionsRequested.value.includes(q1.object.value)) {
                            agentRole.agent = q1.object.value;
                        } else {
                            agentRole.useCustomAgent = true;
                            agentRole.customAgent = q1.object.value;
                        }
                    } else if (q1.predicate.value === loadedQname("dcat:hadRole")) {
                        agentRole.role.push(q1.object.value);
                    }
                }, q.object, null, null);
                if (JSON.stringify(data.value.agentRoles[0]) === JSON.stringify(emptyData.agentRoles[0])) { // first blank agent-role pair, replace
                    data.value.agentRoles[0] = agentRole;
                } else {
                    data.value.agentRoles.push(agentRole);
                }
            }
        }
    }, subject, null, null);
}

function clearData(clicked = false) {
    if (!clicked || confirm("Warning: This will delete all data in the form. Do you wish to continue?")) {
        data.value = emptyData;
        validation.value = {};
        if (clicked) {
            startClearedDataTimeout();
        }
    }
}

function saveDraft() {
    localStorage.setItem("data", JSON.stringify(data.value));
    hasSavedDraft.value = true;
    startSavedDraftTimeout();
}

function deleteDraft() {
    if (confirm("Warning: While your current form will stay unchanged, this will delete your progress saved to the browser. You will lose progress upon browser refresh. Do you wish to continue?")) {
        localStorage.removeItem("data");
        hasSavedDraft.value = false;
        startDeletedDraftTimeout();
    }
}

function loadExample(key) {
    if (confirm("Warning: Loading this example will clear your current form. Do you wish to continue?")) {
        loadRDF({ format: "turtle", value: exampleData[key] });
        nextTick(() => {
            activeExample.value = key;
        });
    }
}

function titleCase(s) {
    return s.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

function filteredAgentOptions(agentRole, index) {
    const selectedAgents = data.value.agentRoles.map(agentRole => agentRole.agent);
    if (agentRole.agent !== "") { // currently selected agent should still show in it's own dropdown
        selectedAgents.splice(index, 1);
    }
    return agentOptionsRequested.value.filter(agent => !selectedAgents.includes(agent.value));
}

function collapseAllSections() {
    if (allOpen.value) {
        // collapse all
        Object.values(sectionRefs.value).forEach(section => {
            section.collapse();
        });
    } else {
        // expand all
        Object.values(sectionRefs.value).forEach(section => {
            section.expand();
        });
    }
}

function onTransition() {
    nextTick(() => {
        if (showRDF.value && tutorialStep.value === 6) {
            positionTutorialContent(6);
        }
    });
}

function positionTutorialContent(stepNo) {
    if (tutorialFocus.value[stepNo]) {
        const tutorialBody = document.querySelector(".tutorial-body");
        tutorialBody.removeAttribute("style"); // reset positioning
        const offsetX = 40; // px
        const padding = 40; // px
        const scrollOffset = 50; // px
        const elementRect = tutorialFocus.value[stepNo].getBoundingClientRect();
        const scrollPosition = elementRect.top + window.scrollY - scrollOffset;

        // position tutorial text Y
        if (scrollPosition > document.body.scrollHeight - window.innerHeight) { // cannot scroll further, at bottom of page
            tutorialBody.style.top = `${window.innerHeight - (document.body.scrollHeight - (elementRect.top + window.scrollY))}px`;
        } else {
            tutorialBody.style.top = `${scrollOffset}px`;
        }
        
        // position tutorial text X
        if (tutorialContent[stepNo].position === "left") {
            const right = window.innerWidth - elementRect.left + offsetX;
            tutorialBody.style.right = `${right}px`;
            tutorialBody.style.maxWidth = `${Math.min(window.innerWidth - right - padding, window.innerWidth / 3)}px`;
            tutorialBody.style.textAlign = "right";
        } else { // right
            const left = elementRect.right + offsetX
            tutorialBody.style.left = `${left}px`;
            tutorialBody.style.maxWidth = `${Math.min(window.innerWidth - left - padding, window.innerWidth / 3)}px`;
        }

        window.scrollTo({ top: scrollPosition, behavior: "smooth" });
    }
}

function tutorialSetStep(stepNo) {
    tutorialStep.value = stepNo;
    if (stepNo === 6) {
        showRDF.value = true;
    } else {
        showRDF.value = false;
        nextTick(() => {
            positionTutorialContent(stepNo);
        });
    }
}

function startTutorial() {
    tutorialFocus.value[6].addEventListener("transitionend", onTransition); // position tutorial text after width transition
    tutorialSetStep(1);
    tutorialEnabled.value = true;
    document.body.classList.add("no-scroll");
}

function tutorialPrevStep() {
    tutorialSetStep(tutorialStep.value - 1);
}

function tutorialNextStep() {
    tutorialSetStep(tutorialStep.value + 1);
}

function closeTutorial() {
    tutorialFocus.value[6].removeEventListener("transitionend", onTransition);
    tutorialEnabled.value = false;
    tutorialStep.value = 0;
    document.body.classList.remove("no-scroll");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// function getSectionStatus(fields, requiredFields) {
//     let status = "complete";

//     fields.every(field => {
//         if (!validation.value[field]) {
//             status = "invalid";
//             return false;
//         } else if (data.value[field] === emptyData[field]) {
//             if (requiredFields.includes(field)) {
//                 status = "invalid";
//                 return false;
//             } else {
//                 status = "incomplete";
//                 return false;
//             }
//         } else {
//              return true;
//         }
//     });

//     return status;
// }

function getSectionStatus(section) {
    if (section === "general") {
        if (calcIri.value === "" || ("iri" in validation.value && !validation.value.iri)) {
            return "invalid";
        } else if (data.value.title === "") {
            return "invalid";
        } else if (data.value.description.trim() === "") {
            return "invalid";
        } else {
            return "complete";
        }
    } else if (section === "agent") {
        // if (data.value.agentRoles.length === 1 && data.value.agentRoles[0].agent === "" && data.value.agentRoles[0].role.length === 0) {
        //     return "invalid";
        // } else {
        //     let status = "complete";
        //     data.value.agentRoles.every(agentRole => {
        //         if ((agentRole.agent === "" || (agentRole.useCustomAgent && agentRole.customAgent === "")) ^ agentRole.role.length === 0) {
        //             status = "invalid";
        //             return false;
        //         } else if (data.value.agentRoles.length > 1 && agentRole.agent === "" && agentRole.role.length === 0) {
        //             status = "invalid";
        //             return false;
        //         } else {
        //             return true;
        //         }
        //     });
        //     return status;
        // }
        let status = "complete";
        data.value.agentRoles.every(agentRole => {
            if (((agentRole.agent === "" && !agentRole.useCustomAgent) || (agentRole.customAgent === "" && agentRole.useCustomAgent)) || agentRole.role.length === 0) {
                status = "invalid";
                return false;
            } else {
                return true;
            }
        });
        return status;
    } else if (section === "dates") {
        if (data.value.created === "") {
            return "invalid";
        } else if (data.value.modified === "") {
            return "invalid";
        } else if (data.value.issued === "") {
            return "incomplete";
        } else {
            return "complete";
        }
    } else if (section === "rights") {
        if ("customLicense" in validation.value && !validation.value.customLicense) {
            return "invalid";
        } else if (calcLicense.value === "" || data.value.rights === "" || data.value.accessRights === "") {
            return "incomplete";
        } else {
            return "complete";
        }
    } else if (section === "spatial") {
        if ("spatialGeom" in validation.value && !validation.value.spatialGeom) {
            return "invalid";
        } else if ("spatialIri" in validation.value && !validation.value.spatialIri) {
            return "invalid";
        } else if (calcGeometry.value === "" || data.value.temporalStart === "" || data.value.temporalEnd === "") {
            return "incomplete";
        } else {
            return "complete";
        }
    } else if (section === "distribution") {
        if ("accessUrl" in validation.value && !validation.value.accessUrl) {
            return "invalid";
        } else if (data.value.accessUrl === "") {
            return "incomplete";
        } else {
            return "complete";
        }
    } else if (section === "theme") {
        if (data.value.themes.length === 0) {
            return "invalid";
        } else {
            return "complete";
        }
    } else if (section === "contact") {
        if (data.value.contactName === "" || data.value.contactEmail === "" || data.value.contactPhone === "") {
            return "incomplete";
        } else {
            return "complete";
        }
    }
}

onMounted(() => {
    const savedData = localStorage.getItem("data");
    if (savedData) {
        data.value = JSON.parse(savedData);
        hasSavedDraft.value = true;
    } else {
        store.value.addQuad(namedNode(defaultIri), namedNode(qname("a")), namedNode(qname("dcat:Resource")));
        serializedData.value = serialize();
    }

    if (useRemoteOptions) {
        // query triplestore for form options
        agentDoSparqlGetQuery(triplestoreUrl, `PREFIX dcterms: <http://purl.org/dc/terms/>
            PREFIX sdo: <https://schema.org/>
            SELECT DISTINCT ?agent (STR(?n) AS ?name) ?indigeneity
            WHERE {
                GRAPH <${agentNamedGraph}> {
                    VALUES ?agentType { sdo:Person sdo:Organization }
                    ?agent a ?agentType ;
                        sdo:name ?n .
                    OPTIONAL {
                        ?agent dcterms:type ?indigeneity .
                    }
                }
            }`,() => {
            agentData.value.forEach(result => {
                agentOptionsRequested.value.push({
                    value: result.agent.value,
                    label: result.name.value,
                    indigeneity: result.indigeneity ? result.indigeneity.value : "",
                });
            });
            agentOptionsRequested.value.sort((a, b) => a.label.localeCompare(b.label));
        });

        roleDoSparqlGetQuery(triplestoreUrl, `PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
            SELECT DISTINCT ?role ?name ?desc
            WHERE {
                BIND(<${ROLES_VOCAB}> AS ?cs)
                ?cs a skos:ConceptScheme .
                ?role a skos:Concept ;
                    skos:inScheme ?cs ;
                    skos:prefLabel ?name ;
                    skos:definition ?desc .
            }`,() => {
            roleData.value.forEach(result => {
                roleOptionsRequested.value.push({
                    value: result.role.value,
                    label: titleCase(result.name.value),
                    desc: result.desc.value.charAt(0).toUpperCase() + result.desc.value.slice(1),
                });
            });
            roleOptionsRequested.value.sort((a, b) => a.label.localeCompare(b.label));
        });

        licenseDoSparqlGetQuery(triplestoreUrl, `PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
            SELECT DISTINCT ?license ?name
            WHERE {
                BIND(<${LICENSE_VOCAB}> AS ?cs)
                ?cs a skos:ConceptScheme .
                ?license a skos:Concept ;
                    skos:inScheme ?cs ;
                    skos:prefLabel ?name .
            }`,() => {
            licenseData.value.forEach(result => {
                licenseOptionsRequested.value.push({
                    value: result.license.value,
                    label: result.name.value
                });
            });
            licenseOptionsRequested.value.sort((a, b) => a.label.localeCompare(b.label));
        });
        
        accessRightsDoSparqlGetQuery(triplestoreUrl, `PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
            SELECT DISTINCT ?accessRight ?name
            WHERE {
                BIND(<${ACCESS_RIGHTS_VOCAB}> AS ?cs)
                ?cs a skos:ConceptScheme .
                ?accessRight a skos:Concept ;
                    skos:inScheme ?cs ;
                    skos:prefLabel ?name .
            }`,() => {
            accessRightsData.value.forEach(result => {
                accessRightsOptionsRequested.value.push({
                    value: result.accessRight.value,
                    label: titleCase(result.name.value)
                });
            });
            accessRightsOptionsRequested.value.sort((a, b) => a.label.localeCompare(b.label));
        });

        themeDoSparqlGetQuery(triplestoreUrl, `PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
            SELECT DISTINCT ?theme ?name
            WHERE {
                BIND(<${THEMES_VOCAB}> AS ?cs)
                ?cs a skos:ConceptScheme .
                ?theme a skos:Concept ;
                    skos:inScheme ?cs ;
                    skos:prefLabel ?name .
            }`,() => {
            themeData.value.forEach(result => {
                themeOptionsRequested.value.push({
                    value: result.theme.value,
                    label: result.name.value
                });
            });
            themeOptionsRequested.value.sort((a, b) => a.label.localeCompare(b.label));
        });

        indigeneityDoSparqlGetQuery(triplestoreUrl, `PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
            SELECT DISTINCT ?indigeneity ?name
            WHERE {
                BIND(<${DATA_INDIGENEITY_VOCAB}> AS ?cs)
                ?cs a skos:ConceptScheme .
                ?indigeneity a skos:Concept ;
                    skos:inScheme ?cs ;
                    skos:prefLabel ?name .
            }`,() => {
            indigeneityData.value.forEach(result => {
                indigeneityOptionsRequested.value.push({
                    value: result.indigeneity.value,
                    label: result.name.value
                });
            });
            indigeneityOptionsRequested.value.sort((a, b) => a.label.localeCompare(b.label));
        });

        agentIndigeneityDoSparqlGetQuery(triplestoreUrl, `PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
            SELECT DISTINCT ?indigeneity ?name
            WHERE {
                BIND(<${ORG_INDIGENEITY_VOCAB}> AS ?cs)
                ?cs a skos:ConceptScheme .
                ?indigeneity a skos:Concept ;
                    skos:inScheme ?cs ;
                    skos:prefLabel ?name .
            }`,() => {
            agentIndigeneityData.value.forEach(result => {
                agentIndigeneityOptionsRequested.value.push({
                    value: result.indigeneity.value,
                    label: result.name.value
                });
            });
            agentIndigeneityOptionsRequested.value.sort((a, b) => a.label.localeCompare(b.label));
        });
    } else {
        // use hard-coded options
        agentOptionsRequested.value = formOptions.agentOptions;
        roleOptionsRequested.value = formOptions.roleOptions;
        licenseOptionsRequested.value = formOptions.licenseOptions;
        accessRightsOptionsRequested.value = formOptions.accessRightsOptions;
        themeOptionsRequested.value = formOptions.themeOptions;
        indigeneityOptionsRequested.value = formOptions.indigeneityOptions;
    }
});
</script>

<template>
    <div id="metadata-container" @keyup.esc="tutorialEnabled && closeTutorial()">
        <div v-if="tutorialEnabled" class="tutorial-overlay">
            <div class="tutorial-content">
                <button class="tutorial-close-btn" @click="closeTutorial" title="Close tutorial"><font-awesome-icon :icon="faXmark" /></button>
                <div class="tutorial-body">
                    {{ tutorialContent[tutorialStep].content }}
                </div>
                <div class="tutorial-btns">
                    <button
                        v-if="tutorialStep > 1"
                        class="btn primary"
                        @click="tutorialPrevStep"
                    >
                        Prev
                    </button>
                    <div
                        v-else
                        class="btn primary"
                        :style="{ visibility: 'hidden' }"
                    >
                        Prev
                    </div>
                    <div class="tutorial-step-btns">
                        <button
                            v-for="stepNo in [...Array(tutorialTotalSteps).keys()].map(step => step + 1)"
                            :class="`tutorial-step-btn ${stepNo === tutorialStep ? 'active' : ''}`"
                            @click="tutorialSetStep(stepNo)"
                        >
                            <font-awesome-icon :icon="stepNo === tutorialStep ? faCircleSolid : faCircleRegular" />
                        </button>
                    </div>
                    <button
                        v-if="tutorialStep < tutorialTotalSteps"
                        class="btn primary"
                        @click="tutorialNextStep"
                    >
                        Next
                    </button>
                    <button
                        v-else
                        class="btn success"
                        @click="closeTutorial"
                    >
                        Finish
                    </button>
                </div>
            </div>
        </div>
        <div id="metadata-header">
            <div id="top-buttons">
                <div class="btn-group">
                    <button class="btn secondary outline tutorial-btn" @click="startTutorial">Start Tutorial</button>
                </div>
                <div class="btn-group">
                    <button class="btn primary outline" @click="collapseAllSections">
                        <template v-if="allOpen">Collapse all <font-awesome-icon :icon="faChevronUp" /></template>
                        <template v-else>Expand all <font-awesome-icon :icon="faChevronDown" /></template>
                    </button>
                </div>
                <div class="btn-group">
                    <div class="btn-with-desc">
                        <input type="file" name="rdfFile" id="rdfFile" :accept="Object.keys(rdfFormats).map(ext => `.${ext}`).join(',')" @change="setFile" hidden>
                        <label :ref="el => tutorialFocus[3] = el" for="rdfFile" :class="`btn secondary outline import-btn ${tutorialStep === 3 ? 'tutorial-focus' : ''}`" title="Import RDF file">Import <font-awesome-icon :icon="faFileImport" /></label>
                        <span class="btn-desc">.ttl, .n3, .nt, .trig</span>
                    </div>
                </div>
                <div class="btn-group">
                    <div :ref="el => tutorialFocus[2] = el" :class="`examples-container ${tutorialStep === 2 ? 'tutorial-focus' : ''}`">
                        <span>Load examples: </span>
                        <div class="examples">
                            <button
                                v-for="example in Object.keys(exampleData)"
                                :class="`btn example sm ${activeExample === example ? 'active' : ''}`"
                                @click="loadExample(example)"
                            >
                                {{ example }}
                            </button>
                        </div>
                    </div>
                </div>
                <div class="btn-group">
                    <button id="toggle-rdf-btn" :ref="el => tutorialFocus[5] = el" :class="`btn primary outline ${tutorialStep === 5 ? 'tutorial-focus' : ''}`" @click="showRDF = !showRDF">
                        <span><template v-if="showRDF">Hide</template><template v-else>Show</template> RDF</span>
                        <font-awesome-icon :icon="showRDF ? faChevronRight : faChevronLeft" />
                    </button>
                </div>
            </div>
        </div>
        <div id="metadata-body" :class="`${showRDF ? 'show-rdf' : ''}`">
            <div :ref="el => tutorialFocus[1] = el" :class="`metadata-col ${tutorialStep === 1 ? 'tutorial-focus' : ''}`" id="metadata-form">
                <div class="col-body" id="form-items">
                    <FormSection defaultOpen title="General" :ref="el => sectionRefs.general = el" @collapse="sectionCollapsed.general = $event" :status="getSectionStatus('general')">
                        <template #description>
                            Basic information about this data.
                        </template>
                        <FormField description="Provide an IRI or choose to have an IRI automatically assigned">
                            <FormInput
                                label="IRI"
                                type="url"
                                id="iri"
                                placeholder="e.g. http://example.com/1234"
                                required
                                @validate="!data.assignIri && handleValidate('iri', $event)"
                                :validationFns="[validateIri]"
                                v-model="calcIri"
                                clearButton
                                :disabled="data.assignIri"
                            >
                                <template #tooltip>
                                    An IRI is a standard identifier in the form of a web address (URL). Good IRIs are part of a managed system.
                                </template>
                            </FormInput>
                            <FormInput
                                label="Assign IRI"
                                type="checkbox"
                                id="assignIRI"
                                v-model="data.assignIri"
                                switch
                            />
                        </FormField>
                        <FormField>
                            <FormInput
                                label="Title"
                                type="text"
                                id="title"
                                required
                                v-model="data.title"
                                clearButton
                                @validate="handleValidate('title', $event)"
                            >
                                <template #tooltip>
                                    <PropTooltip v-if="showPropTooltips" v-bind="propDetails.title" />
                                    <template v-else>
                                        The name of the data that this metadata is describing.
                                    </template>
                                </template>
                            </FormInput>
                        </FormField>
                        <FormField :span="2">
                            <FormInput
                                label="Indigeneity"
                                type="select"
                                v-model="data.indigeneity"
                                :options="indigeneityOptionsRequested"
                                description="You can add mulitple indigeneity terms"
                                multiple
                                clearButton
                            >
                                <template #tooltip>
                                    <PropTooltip v-if="showPropTooltips" v-bind="propDetails.indigeneity" />
                                    <template v-else>
                                        The indigeneity of this dataset.
                                    </template>
                                </template>
                            </FormInput>
                        </FormField>
                        <FormField :span="2">
                            <FormInput
                                label="Description"
                                type="textarea"
                                id="description"
                                v-model="data.description"
                                description="Supports new lines and basic formatting"
                                required
                                @validate="handleValidate('description', $event)"
                            >
                                <template #tooltip>
                                    <PropTooltip v-if="showPropTooltips" v-bind="propDetails.description" />
                                    <template v-else>
                                        A free-text description of the data. This can include how it was created and its intended purpose.
                                    </template>
                                </template>
                            </FormInput>
                        </FormField>
                    </FormSection>
                    <FormSection title="Agent Information" :ref="el => sectionRefs.agent = el" @collapse="sectionCollapsed.agent = $event" :status="getSectionStatus('agent')">
                        <template #description>
                            Information about the roles that agents (people and organisations) play with respect to this data. These roles are critical in determining whether this data is managed properly. Each Agent must have a matching Role.
                        </template>
                        <template v-for="(agentRole, index) in data.agentRoles">
                            <FormField direction="row" :span="2">
                                <FormField>
                                    <FormField v-show="agentRole.useCustomAgent" direction="row">
                                        <FormInput
                                            :id="`customagent-name-${index}`"
                                            type="text"
                                            v-model="agentRole.customAgent.name"
                                            label="Custom Agent"
                                            disabled
                                        />
                                        <button
                                            class="btn primary outline"
                                            @click="modal = `customAgent-${index}`"
                                            title="Add custom agent data"
                                        >
                                            <font-awesome-icon :icon="agentRole.customAgent.name === '' ? faPlus : faPencil" />
                                        </button>
                                        <template #tooltip>
                                            <PropTooltip v-if="showPropTooltips" v-bind="propDetails.agent" />
                                            <template v-else>
                                                The name of the person, community or business that is providing this data.
                                            </template>
                                        </template>
                                        <template v-if="agentRole.customAgent.review" #description>
                                            <font-awesome-layers fixed-width>
                                                <font-awesome-icon :icon="faCircleRegular" />
                                                <font-awesome-icon :icon="faExclamation" transform="shrink-6" />
                                            </font-awesome-layers>
                                            Review requested
                                        </template>
                                    </FormField>
                                    <BaseModal v-if="modal === `customAgent-${index}`" @modalClosed="modal = null">
                                        <template #headerMiddle>Custom Agent</template>
                                        <CustomAgentForm
                                            :customAgent="agentRole.customAgent"
                                            :indigeneityOptions="agentIndigeneityOptionsRequested"
                                            @save="customAgent => {data.agentRoles[index].customAgent = customAgent; modal = null}"
                                            @delete="() => {data.agentRoles[index].customAgent = {...emptyData.agentRoles[0].customAgent}; modal = null}"
                                            @modalClosed="modal = null"
                                        />
                                    </BaseModal>
                                    <FormInput
                                        v-show="!agentRole.useCustomAgent"
                                        label="Agent"
                                        type="select"
                                        :id="`agent-${index}`"
                                        v-model="agentRole.agent"
                                        clearButton
                                        :options="filteredAgentOptions(agentRole, index)"
                                        searchable
                                        required
                                        @validate="handleValidate('agent', $event)"
                                    >
                                        <template #tooltip>
                                            <PropTooltip v-if="showPropTooltips" v-bind="propDetails.agent" />
                                            <template v-else>
                                                The name of the person, community or business that is providing this data.
                                            </template>
                                        </template>
                                    </FormInput>
                                    <FormInput type="checkbox" switch label="Use Custom Agent" v-model="agentRole.useCustomAgent" />
                                </FormField>
                                <FormInput
                                    label="Role"
                                    type="select"
                                    :id="`role-${index}`"
                                    v-model="agentRole.role"
                                    clearButton
                                    :options="roleOptionsRequested"
                                    searchable
                                    multiple
                                    required
                                    @validate="handleValidate('role', $event)"
                                >
                                    <template #append>
                                        <button class="modal-btn" @click="modal = 'agentRole'" title="Role info">
                                            <font-awesome-layers fixed-width>
                                                <font-awesome-icon :icon="faCircleRegular" />
                                                <font-awesome-icon :icon="faInfo" transform="shrink-6" />
                                            </font-awesome-layers>
                                        </button>
                                        <BaseModal v-if="modal === 'agentRole'" @modalClosed="modal = null">
                                            <template #headerMiddle>
                                                <h3>Agent Roles</h3>
                                            </template>
                                            <p>Below is a list for reference of roles and their brief definitions. The full list of agent roles can be found <a href="https://data.idnau.org/v/vocab/defn:data-roles" target="_blank" rel="noopener noreferrer">here</a>.</p>
                                            <div class="modal-items">
                                                <div v-for="role in roleOptionsRequested" class="modal-item">
                                                    <a :href="`https://data.idnau.org/object?uri=${encodeURIComponent(role.value)}`" target="_blank" rel="noopener noreferrer">{{ role.label }}</a>
                                                    <p>{{ role.desc }}</p>
                                                </div>
                                            </div>
                                        </BaseModal>
                                    </template>
                                    <template #tooltip>
                                        <PropTooltip v-if="showPropTooltips" v-bind="propDetails.role" />
                                        <template v-else>
                                            What role (e.g. custodian) the named person, community or business has with this data.
                                        </template>
                                    </template>
                                </FormInput>
                                <button v-if="index > 0" class="btn outline danger delete-agent-btn" title="Delete agent-role pair" @click="data.agentRoles.splice(index, 1);"><font-awesome-icon :icon="faTrash" /></button>
                            </FormField>
                            <FormField :span="2" direction="column">
                                <FormInput :id="`idg-exists-${index}`" type="radio" v-model="agentRole.idg.exists" :options="idgOptions" required label="Does the Agent with role Custodian have documented Indigenous Data Governance, or Stewardship Committee?" class="radio-row" />
                                <FormInput v-show="agentRole.idg.exists === 'true'" :id="`idg-public-${index}`" type="radio" v-model="agentRole.idg.public" :options="idgOptions" required label="Is the governance publicly available?" class="radio-row">
                                    <template v-if="agentRole.idg.public === 'false'" #description>If No, provide a description of the governance and stewardship for Indigenous Data undertaken by the Agent Organisation</template>
                                </FormInput>
                                <FormInput v-show="agentRole.idg.exists === 'true' && agentRole.idg.public === 'true'" type="url" v-model="agentRole.idg.url" :id="`idg-url-${index}`" required clearButton label="URL" />
                                <FormInput v-show="agentRole.idg.exists === 'true' && agentRole.idg.public === 'false'" type="textarea" v-model="agentRole.idg.desc" :id="`idg-desc-${index}`" required clearButton label="Description" description="Supports new lines and basic formatting" />
                            </FormField>
                        </template>
                        <button class="btn secondary outline add-agent-btn" @click="data.agentRoles.push(JSON.parse(JSON.stringify(emptyData.agentRoles[0])))"><font-awesome-icon :icon="faPlus" /> Add Agent</button>
                    </FormSection>
                    <FormSection title="Dates" :ref="el => sectionRefs.dates = el" @collapse="sectionCollapsed.dates = $event" :status="getSectionStatus('dates')">
                        <template #description>
                            Standard dates for the establishment and update times of this dataset. A dataset about early 20th century data might only have been made last year and the created date is then some time last year. "Issued" indicates when, if ever, this dataset was published.
                        </template>
                        <FormField>
                            <FormInput
                                label="Created"
                                type="date"
                                id="created"
                                required
                                @validate="handleValidate('created', $event)"
                                v-model="data.created"
                                clearButton
                            >
                                <template #tooltip>
                                    <PropTooltip v-if="showPropTooltips" v-bind="propDetails.created" />
                                    <template v-else>
                                        This is the date that this dataset was created (NOT the date the data occurred).
                                    </template>
                                </template>
                            </FormInput>
                        </FormField>
                        <FormField>
                            <FormInput
                                label="Modified"
                                type="date"
                                id="modified"
                                required
                                @validate="handleValidate('modified', $event)"
                                v-model="data.modified"
                                clearButton
                            >
                                <template #tooltip>
                                    <PropTooltip v-if="showPropTooltips" v-bind="propDetails.modified" />
                                    <template v-else>
                                        The most recent date on which the data was modified. It can be the same as the date it was created.
                                    </template>
                                </template>
                            </FormInput>
                        </FormField>
                        <FormField>
                            <FormInput
                                label="Issued"
                                type="date"
                                id="issued"
                                v-model="data.issued"
                                clearButton
                            >
                                <template #tooltip>
                                    <PropTooltip v-if="showPropTooltips" v-bind="propDetails.issued" />
                                    <template v-else>
                                        This is the date that this dataset was published or distributed.
                                    </template>
                                </template>
                            </FormInput>
                        </FormField>
                    </FormSection>
                    <FormSection title="Rights" :ref="el => sectionRefs.rights = el" @collapse="sectionCollapsed.rights = $event" :status="getSectionStatus('rights')">
                        <template #description>
                            Ownership and access information of the data. If a license is selected then the rights holder to that license should also be included.
                        </template>
                        <FormField>
                            <FormInput
                                v-show="!data.useCustomLicense"
                                label="License"
                                type="select"
                                id="license"
                                v-model="data.license"
                                clearButton
                                :options="licenseOptionsRequested"
                                searchable
                            >
                                <template #append>
                                    <button class="modal-btn" @click="modal = 'license'" title="License info">
                                        <font-awesome-layers fixed-width>
                                            <font-awesome-icon :icon="faCircleRegular" />
                                            <font-awesome-icon :icon="faInfo" transform="shrink-6" />
                                        </font-awesome-layers>
                                    </button>
                                    <BaseModal v-if="modal === 'license'" @modalClosed="modal = null">
                                        <template #headerMiddle>
                                            <h3>Licenses</h3>
                                        </template>
                                        <div v-for="license in licenseOptionsRequested">
                                            <a :href="license.value" target="_blank" rel="noopener noreferrer">{{ license.label }}</a> - {{ license.desc }}
                                        </div>
                                    </BaseModal>
                                </template>
                                <template #tooltip>
                                    <PropTooltip v-if="showPropTooltips" v-bind="propDetails.license" />
                                    <template v-else>
                                        This is the legal information under which the data is made available.
                                    </template>
                                </template>
                            </FormInput>
                            <FormInput
                                v-show="data.useCustomLicense"
                                label="License IRI"
                                placeholder="e.g. http://example.com/1234"
                                type="text"
                                v-model="data.customLicense"
                                @validate="handleValidate('customLicense', $event)"
                                :validationFns="[validateIri]"
                                clearButton
                            >
                                <template #tooltip>
                                    <PropTooltip v-if="showPropTooltips" v-bind="propDetails.license" />
                                    <template v-else>
                                        This is the legal information under which the data is made available.
                                    </template>
                                </template>
                            </FormInput>
                            <FormInput
                                label="Provide License IRI"
                                id="custom-license"
                                type="checkbox"
                                v-model="data.useCustomLicense"
                                switch
                            />
                            <!-- <template #bottom>
                                <FormInput
                                    v-if="data.license === 'new'"
                                    label="Enter a new license"
                                    type="text"
                                    v-model="data.customLicense"
                                    :clearButton="true"
                                />
                            </template> -->
                        </FormField>
                        <FormField>
                            <FormInput
                                label="Rights"
                                type="text"
                                id="rights"
                                v-model="data.rights"
                                clearButton
                            >
                                <template #tooltip>
                                    <PropTooltip v-if="showPropTooltips" v-bind="propDetails.rights" />
                                    <template v-else>
                                        This is a statement that provides required details of who holds the license selected previously. e.g. ©University of Melbourne.
                                    </template>
                                </template>
                            </FormInput>
                        </FormField>
                        <FormField>
                            <FormInput
                                label="Access Rights"
                                type="select"
                                id="accessRights"
                                v-model="data.accessRights"
                                clearButton
                                :options="accessRightsOptionsRequested"
                                searchable
                            >
                                <template #tooltip>
                                    <PropTooltip v-if="showPropTooltips" v-bind="propDetails.accessRights" />
                                    <template v-else>
                                        Data access rights control how users and systems access a data resource. e.g. Metadata access only. Definitions can be found <a href="https://data.idnau.org/v/vocab/defn:data-access-rights" target="_blank" rel="noopener noreferrer">here</a>.
                                    </template>
                                </template>
                            </FormInput>
                        </FormField>
                    </FormSection>
                    <FormSection title="Spatio/Temporal" :ref="el => sectionRefs.spatial = el" @collapse="sectionCollapsed.spatial = $event" :status="getSectionStatus('spatial')">
                        <template #description>
                            The spatial (geographical) and temporal (time period) extent of the data. Temporal information is different from the dates section as, for example, this dataset may have been created recently but is about someone or something long ago.
                        </template>
                        <FormField label="Spatial geometry">
                            <FormInput
                                v-show="!data.useSpatialIri"
                                label="Geometry"
                                type="text"
                                v-model="data.spatialGeom"
                                clearButton
                                placeholder="e.g. POLYGON ((1234 1234, 1235 1245))"
                                :disabled="data.useSpatialIri"
                                description="Must be WKT format"
                                @validate="handleValidate('spatialGeom', $event)"
                                :validationFns="[validateWktString]"
                            >
                                <template #tooltip>
                                    <PropTooltip v-if="showPropTooltips" v-bind="propDetails.spatialGeometry" />
                                    <template v-else>
                                        If WKT String is selected, this is the ASCII representation of a spatial object provided in <a href="https://www.vertica.com/docs/9.3.x/HTML/Content/Authoring/AnalyzingData/Geospatial/Spatial_Definitions/WellknownTextWKT.htm" target="_blank" rel="noopener noreferrer">Well Known Text (WKT)</a> format - e.g. POLYGON ((96 -45, 96 -9, 168 -9, 168 -45, 96 -45)) (order of coords is [long, lat]). If Spatial IRI is selected, this is the standard identifier (URL) link to the location connected to the data. e.g. Melbourne has the following spatial IRI -  https://linked.data.gov.au/dataset/asgsed3/GCCSA/2GMEL
                                    </template>
                                </template>
                            </FormInput>
                            <FormInput
                                v-show="data.useSpatialIri"
                                label="Spatial IRI"
                                type="url"
                                v-model="data.spatialIri"
                                clearButton
                                placeholder="e.g. http://example.com/1234"
                                :disabled="!data.useSpatialIri"
                                description="Must be a valid IRI"
                                @validate="handleValidate('spatialIri', $event)"
                                :validationFns="[validateIri]"
                            >
                                <template #tooltip>
                                    <PropTooltip v-if="showPropTooltips" v-bind="propDetails.spatialIri" />
                                    <template v-else>
                                        If WKT String is selected, this is the ASCII representation of a spatial object provided in <a href="https://www.vertica.com/docs/9.3.x/HTML/Content/Authoring/AnalyzingData/Geospatial/Spatial_Definitions/WellknownTextWKT.htm" target="_blank" rel="noopener noreferrer">Well Known Text (WKT)</a> format. If Spatial IRI is selected, this is the standard identifier (URL) link to the location connected to the data. e.g. Melbourne has the following spatial IRI -  https://linked.data.gov.au/dataset/asgsed3/GCCSA/2GMEL
                                    </template>
                                </template>
                            </FormInput>
                            <FormInput
                                label="Use Spatial IRI"
                                leftLabel="WKT String"
                                rightLabel="Spatial IRI"
                                type="checkbox"
                                id="use-spatial-iri"
                                v-model="data.useSpatialIri"
                                switch
                            />
                        </FormField>
                        <FormField label="Temporal" description="Start & end date">
                            <FormInput
                                label="Start"
                                type="date-optional"
                                v-model="data.temporalStart"
                                clearButton
                            >
                            </FormInput>
                            <FormInput
                                label="End"
                                type="date-optional"
                                v-model="data.temporalEnd"
                                clearButton
                            >
                            </FormInput>
                            <template #tooltip>
                                <PropTooltip v-if="showPropTooltips" v-bind="propDetails.startDate" />
                                <template v-else>
                                    This is the interval of time which the data covers at the time of publishing. There must be a start and end date.
                                </template>
                            </template>
                        </FormField>
                    </FormSection>
                    <FormSection title="Distribution Info" :ref="el => sectionRefs.distribution = el" @collapse="sectionCollapsed.distribution = $event" :status="getSectionStatus('distribution')">
                        <template #description>
                            This is optional information in the form of a publicly resolvable URL that gives the user access to the data.
                        </template>
                        <FormField :span="2">
                            <FormInput
                                label="Access URL"
                                type="url"
                                id="accessUrl"
                                description="Must be a reachable URL"
                                placeholder="e.g. http://example.com/1234"
                                :validationFns="[validateIri]"
                                @validate="handleValidate('accessUrl', $event)"
                                v-model="data.accessUrl"
                                clearButton
                            >
                                <!-- <template #prepend>
                                    <FormInput
                                        type="select"
                                        id="protocol"
                                        v-model="urlProtocol"
                                        :options="urlProtocolOptions"
                                    />
                                </template> -->
                                <template #append v-if="loading.accessUrl">
                                    <span><font-awesome-icon :icon="faCircleNotch" /></span>
                                </template>
                                <template #tooltip>
                                    <PropTooltip v-if="showPropTooltips" v-bind="propDetails.accessUrl" />
                                    <template v-else>
                                        A URL is normally in the format https://… . If you are NOT submitting the metadata to the Indigenous Data Network, you could insert any resolvable URL into the metadata.
                                    </template>
                                </template>
                            </FormInput>
                        </FormField>
                    </FormSection>
                    <FormSection title="Theme" :ref="el => sectionRefs.theme = el" @collapse="sectionCollapsed.theme = $event" :status="getSectionStatus('theme')">
                        <template #description>
                            Classification or categorisation of this data. We are mostly concerned with indications of "indigeneity", i.e. how this data is related to indigenous people, however other classifications may also be added. Our primary indigenous classification vocabulary is online at <a href="https://data.idnau.org/v/vocab/vcb:idn-th" target="_blank" rel="noopener noreferrer">https://data.idnau.org/v/vocab/vcb:idn-th</a> which may be browsed for classification suggestions.
                        </template>
                        <FormField :span="2">
                            <FormInput
                                label="Theme"
                                type="select"
                                id="theme"
                                v-model="data.themes"
                                clearButton
                                :options="themeOptionsRequested"
                                multiple
                                searchable
                                required
                                @validate="handleValidate('theme', $event)"
                            >
                                <template #description>
                                    You can add more than one Theme term. Click on Theme and select the required term or type the required term in the Search field.
                                </template>
                                <template #tooltip>
                                    <PropTooltip v-if="showPropTooltips" v-bind="propDetails.theme" />
                                    <template v-else>
                                        Our vocabulary for the primary classification for indigeneity of data being described can be browsed <a href="https://data.idnau.org/v/vocab/vcb:idn-th" target="_blank" rel="noopener noreferrer">here</a>. This vocabulary contains historical terms which exist in legacy data but are no longer used today. We welcome suggestions and feedback on this vocabulary.
                                    </template>
                                </template>
                            </FormInput>
                        </FormField>
                    </FormSection>
                    <FormSection title="Contact Details" :ref="el => sectionRefs.contact = el" @collapse="sectionCollapsed.contact = $event" :status="getSectionStatus('contact')">
                        <template #description>
                            These details are required if you are submitting this metadata to the IDN.
                            <br/><br/>
                            These details are also added as the point of contact for this data unless you've specifically indicated an Agent as the Point of Contact above.
                        </template>
                        <FormField>
                            <FormInput
                                label="Name"
                                type="text"
                                id="contactName"
                                v-model="data.contactName"
                                clearButton
                            />
                        </FormField>
                        <FormField>
                            <FormInput
                                label="Email"
                                type="email"
                                id="contactEmail"
                                v-model="data.contactEmail"
                                clearButton
                            />
                        </FormField>
                        <FormField>
                            <FormInput
                                label="Phone"
                                type="tel"
                                id="contactPhone"
                                v-model="data.contactPhone"
                                clearButton
                            />
                        </FormField>
                    </FormSection>
                </div>
            </div>
            <div :ref="el => tutorialFocus[4] = el" :class="`metadata-col ${tutorialStep === 4 ? 'tutorial-focus' : ''}`" id="metadata-scores">
                <div class="col-body">
                    <FairScore :score="fairScore" />
                    <CareScore :score="careScore" />
                </div>
            </div>
            <div :ref="el => tutorialFocus[6] = el" :class="`metadata-col ${tutorialStep === 6 ? 'tutorial-focus' : ''}`" id="metadata-rdf">
                <div class="col-body">
                    <RDFPreview :data="serializedData" />
                </div>
            </div>
        </div>
        <div id="metadata-footer">
            <!-- <p>
                Form declaration
            </p>
            <FormInput
                label="I agree"
                type="checkbox"
                id="declaration-check"
                v-model="declarationTicked"
            /> -->
            <div id="bottom-buttons">
                <div class="btn-group">
                    <button :ref="el => tutorialFocus[7] = el" :class="`btn success outline ${tutorialStep === 7 ? 'tutorial-focus' : ''}`" @click="saveDraft" :disabled="empty">
                        <template v-if="savedDraft">
                            Draft saved!
                        </template>
                        <template v-else>
                            Save Draft <font-awesome-icon :icon="faFloppyDisk" />
                        </template>
                    </button>
                </div>
                <div class="btn-group">
                    <a
                        :ref="el => tutorialFocus[9] = el"
                        :class="`btn success outline export-btn ${tutorialStep === 9 ? 'tutorial-focus' : ''}`"
                        :href="!empty ? `data:text/turtle;charset=utf-8,${encodeURIComponent(serializedData)}` : null"
                        :download="!empty ? `${data.title || 'metadata'}.ttl` : null"
                        :disabled="empty"
                        title="Export as RDF file (.ttl)"
                    >
                        Export <font-awesome-icon :icon="faFileExport" />
                    </a>
                </div>
                <div :ref="el => tutorialFocus[8] = el" :class="`btn-group ${tutorialStep === 8 ? 'tutorial-focus' : ''}`">
                    <button class="btn outline danger" @click="deleteDraft" :disabled="!hasSavedDraft">
                        <template v-if="deletedDraft">
                            Draft deleted!
                        </template>
                        <template v-else>
                            Delete Draft <font-awesome-icon :icon="faTrash" />
                        </template>
                    </button>
                    <button class="btn danger" @click="clearData(true)" :disabled="empty">
                        <template v-if="clearedData">
                            Cleared data!
                        </template>
                        <template v-else>
                            Clear Data <font-awesome-icon :icon="faDeleteLeft" />
                        </template>
                    </button>
                </div>
                <div class="btn-group">
                    <button
                        :ref="el => tutorialFocus[10] = el"
                        :class="`btn success lg submit-btn ${tutorialStep === 10 ? 'tutorial-focus' : ''}`"
                        title="Coming soon"
                        :disabled="tutorialEnabled ? false : (usingCustomAgents ? true : (!isValid || !minData))"
                        @click="modal = 'submit'"
                    >
                        Submit for review
                    </button>
                </div>
                <BaseModal v-if="modal === 'submit'" @modalClosed="modal = null">
                    <template #headerMiddle>
                        <h3>Submit Metadata to the IDN</h3>
                    </template>
                    <p>By clicking "I agree" below, you agree that the metadata to be submitted is Indigenous metadata and you consent to the review by the IDN.</p>
                    <FormInput
                        label="I agree"
                        type="checkbox"
                        id="declaration-check"
                        v-model="declarationTicked"
                    />
                    <button class="btn success lg submit-btn" :style="{ margin: '0 auto' }" :disabled="!declarationTicked" title="Currently disabled">Submit</button>
                </BaseModal>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "@/assets/_variables.scss";
@import "@/assets/_mixins.scss";

$gap: 16px;
$padding: 12px;

#metadata-container {
    display: flex;
    flex-direction: column;
    // gap: $gap;
    background-color: $formBg;
    border-radius: $borderRadius;
    margin-top: 12px;

    #metadata-header {
        display: flex;
        flex-direction: column;
        padding: $padding;

        #metadata-title {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            gap: 12px;

            h2 {
                text-align: center;
                position: relative;
                left: 50%;
                transform: translateX(-50%);
            }

            
        }

        #metadata-desc {
            display: flex;
            flex-direction: column;
        }
    }

    #metadata-body {
        display: flex;
        flex-direction: row;
        flex-grow: 1;

        &.show-rdf {
            #metadata-form {
                width: 50%;
            }

            #metadata-scores {
                width: 20%;
            }

            #metadata-rdf {
                width: 30%;
                margin-left: $gap;
            }
        }

        &:not(.show-rdf) {
            #metadata-form {
                width: 75%;
            }

            #metadata-scores {
                width: 25%;
            }

            #metadata-rdf {
                width: 0%;
                padding-left: 0;
                padding-right: 0;
                margin-left: 0;
            }
        }

        .metadata-col {
            display: grid;
            grid-template-rows: 1fr;
            grid-template-columns: 100%;
            gap: $padding;
            padding: $padding;
            @include transition(width, margin, padding);

            & > * {
                max-width: 100%;
            }

            .col-header {
                display: flex;
                justify-content: center;
                align-items: center;

                h3 {
                    text-align: center;
                    margin: 0;
                }
            }

            .col-body {
                display: flex;
                flex-direction: column;
                gap: $padding;
            }

            &#metadata-form {

                #form-items {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
            }

            &#metadata-scores {
                margin-left: $gap;
            }

            &#metadata-rdf {
                overflow-x: hidden;

                #rdf-data {
                    flex-grow: 1;
                }
            }
        }
    }

    #metadata-footer {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: $padding;

        #form-buttons {
            display: flex;
            flex-direction: row;
            gap: 12px;
            
            
        }
    }
}

.examples-container {
    display: flex;
    flex-direction: row;
    gap: 8px;
    align-items: center;
    margin-right: auto;

    span {
        font-size: 0.9em;
    }

    .examples {
        display: flex;
        flex-direction: row;
        gap: 6px;
        align-items: center;

        .example {
            &.active {
                background-color: #b3b3b3;
            }
        }
    }
}

#top-buttons {
    align-items: flex-start;
}

#bottom-buttons {
    align-items: flex-end;
}

#top-buttons, #bottom-buttons {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 12px;
    
    .btn-group {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;

        .btn-with-desc {
            display: flex;
            flex-direction: column;
            gap: 6px;

            .btn {
                align-self: baseline;
            }

            .btn-desc {
                font-size: 0.7rem;
                color: grey;
            }
        }
    }
}

button#toggle-rdf-btn {
    display: flex;
    flex-direction: row;
    gap: 8px;
    align-items: center;
}

button.submit-btn {
    margin-left: auto;

    &:disabled {
        background-color: grey;
    }
}

a.export-btn, label.import-btn {
    text-decoration: none;
    font-weight: normal;
    font-size: 0.833em;
}

button.modal-btn {
    cursor: pointer;
}

button.add-agent-btn {
    justify-self: baseline;
}

button.delete-agent-btn {
    align-self: baseline;
    margin-top: 7px;
}

:deep(.modal-items) {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .modal-item {
        background-color: $bg1;
        padding: 8px;
        border-radius: $borderRadius;
        display: flex;
        flex-direction: column;
        gap: 8px;

        p {
            margin: 0;
            font-size: 0.85em;
            font-style: italic;
        }
    }
}

.tutorial-overlay {
    z-index: 1001;
    height: 100%;
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;

    .tutorial-content {
        height: 100%;
        $padding: 40px;
        padding: $padding;
        position: relative;

        button.tutorial-close-btn {
            cursor: pointer;
            position: absolute;
            top: calc($padding / 2);
            right: calc($padding / 2);
            background-color: transparent;
            border: none;
            color: #e2e2e2;
            font-size: 1.3em;
            @include transition(color);

            &:hover {
                color: white;
            }
        }

        .tutorial-body {
            position: absolute;
            color: white;
            padding: 2px;
        }

        .tutorial-btns {
            position: absolute;
            bottom: $padding;
            display: flex;
            flex-direction: row;
            margin-top: auto;
            justify-content: space-around;
            gap: 12px;
            width: 100%;

            .tutorial-step-btns {
                display: flex;
                flex-direction: row;

                .tutorial-step-btn {
                    outline: none;
                    border: none;
                    padding: 8px;
                    cursor: pointer;
                    background-color: transparent;
                    color: white;
                }
            }
        }
    }
}

.tutorial-focus {
    z-index: 1000;
    outline: 5000px solid rgba(0, 0, 0, 0.6);
}

:deep(.radio-row .input-component) {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 2px;

    & > label {
        margin-right: 2px;
    }
}
</style>

<style lang="scss">
body.no-scroll {
    overflow-y: hidden;
}
</style>
