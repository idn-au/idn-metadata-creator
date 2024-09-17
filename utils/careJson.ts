import type { ScoreDefObj } from "~/types";

const careRules: ScoreDefObj = {
    c: {
        title: "Collective Benefit",
        description: "Data ecosystems shall be designed and function in ways that enable Indigenous Peoples to derive benefit from the data.",
        scores: {
            c1: {
                title: "C1",
                description: "For inclusive development and innovation",
                requirements: [
                    {
                        value: 1,
                        description: "Metadata is discoverable (persistently identified)",
                        query: `ASK { #iri# ?p ?o }`,
                    },
                    {
                        value: 1,
                        description: "The data has been assigned one or more Indigeneity terms",
                        query: `ASK { #iri# dcterms:type ?indigeneity }`,
                    },
                    {
                        value: 1,
                        description: "Data has Access Rights described",
                        query: `ASK { #iri# dcterms:accessRights ?accessRights }`,
                    },
                ],
            },
            c2: {
                title: "C2",
                description: "For improved government and citizen engagement",
                prerequisites: {
                    conditions: [
                        {
                            title: "C1 has scored fully",
                            key: "c1",
                            value: "max",
                        },
                    ],
                },
                requirements: [
                    {
                        value: 1,
                        description: "Metadata is discoverable via the internet (i.e. IRI resolves)",
                        query: `ASK { #iri# ?p ?o }`,
                    },
                    {
                        value: 1,
                        description: "Data title exists",
                        query: `ASK { #iri# dcterms:title ?title }`,
                    },
                    {
                        value: 1,
                        description: "Data description exists",
                        query: `ASK { #iri# dcterms:description ?description }`,
                    },
                    {
                        value: 1,
                        description: "Custodian (Role) Agent information in database has indigeneity = “Indigenous Persons Organisation” OR “Owned By Indigenous Persons” OR “Run By Indigenous Persons”",
                        query: `ASK {
                                    VALUES ?indigeneity {
                                        <https://data.idnau.org/pid/vocab/org-indigeneity/run-by-indigenous-persons>
                                        <https://data.idnau.org/pid/vocab/org-indigeneity/owned-by-indigenous-persons>
                                        <https://data.idnau.org/pid/vocab/org-indigeneity/indigenous-persons-organisation>
                                    }
                                    #iri# prov:qualifiedAttribution ?agentRole .
                                    ?agentRole dcat:hadRole <https://linked.data.gov.au/def/data-roles/custodian> ;
                                        prov:agent ?agent .
                                    ?agent dcterms:type ?indigeneity .
                                }`,
                    },
                ],
            },
            c3: {
                title: "C3",
                description: "For inclusive development and innovation",
                prerequisites: {
                    conditions: [
                        {
                            title: "C2 has scored fully",
                            key: "c2",
                            value: "max",
                        },
                    ],
                },
                requirements: [
                    {
                        value: 2,
                        description: "License and Rights have been identified and Agent with role “Rights Holder” has been identified",
                        query: `ASK {
                                    #iri# dcterms:license ?license ;
                                        dcterms:rights ?rights ;
                                        prov:qualifiedAttribution ?agentRole .
                                    ?agentRole dcat:hadRole <https://linked.data.gov.au/def/data-roles/rightsHolder> .
                                }`,
                    },
                    {
                        value: 1,
                        description: "Data distribution information exists",
                        query: `ASK {
                                    #iri# dcat:distribution ?distribution .
                                    ?distribution dcat:accessURL ?url .
                                }`,
                    },
                ],
            },
        },
    },
    a: {
        title: "Authority to Control",
        description: "Indigenous Peoples' rights and interests in Indigenous data must be recognised and their authority to control such data be empowered.",
        scores: {
            a1: {
                title: "A1",
                description: "Recognizing rights and interests",
                requirements: [
                    {
                        value: 1,
                        description: "Custodian (Role) Agent information in database has indigeneity = “Indigenous Persons Organisation” OR “Owned By Indigenous Persons” OR “Run By Indigenous Persons”",
                        query: `ASK {
                                    VALUES ?indigeneity {
                                        <https://data.idnau.org/pid/vocab/org-indigeneity/run-by-indigenous-persons>
                                        <https://data.idnau.org/pid/vocab/org-indigeneity/owned-by-indigenous-persons>
                                        <https://data.idnau.org/pid/vocab/org-indigeneity/indigenous-persons-organisation>
                                    }
                                    #iri# prov:qualifiedAttribution ?agentRole .
                                    ?agentRole dcat:hadRole <https://linked.data.gov.au/def/data-roles/custodian> ;
                                        prov:agent ?agent .
                                    ?agent dcterms:type ?indigeneity .
                                }`,
                    },
                    {
                        value: 2,
                        description: "License and Rights have been identified and Agent with role “Rights Holder” has been identified",
                        query: `ASK {
                                    #iri# dcterms:license ?license ;
                                        dcterms:rights ?rights ;
                                        prov:qualifiedAttribution ?agentRole .
                                    ?agentRole dcat:hadRole <https://linked.data.gov.au/def/data-roles/rightsHolder> .
                                }`,
                    },
                ],
            },
            a2: {
                title: "A2",
                description: "Data for governance",
                prerequisites: {
                    conditions: [
                        {
                            title: "A1 has scored fully",
                            key: "a1",
                            value: "max",
                        },
                    ],
                },
                requirements: [
                    {
                        value: 1,
                        description: "The URL link to, OR text description of, an Indigenous Data Governance Framework or Indigenous Data Committee is identified in the metadata record",
                        query: `ASK {
                                    #iri# prov:wasInfluencedBy ?idgf .
                                    ?idgf sdo:additionalType <https://data.idnau.org/pid/vocab/policy-types/indigenous-data-governance> ;
                                        sdo:url|sdo:description ?o .
                                }`,
                    },
                    {
                        value: 1,
                        description: "Agent which has indicated the Indigenous Data Governance Framework has Role = Custodian",
                        query: `ASK {
                                    #iri# prov:qualifiedAttribution ?agentRole .
                                    ?agentRole dcat:hadRole <https://linked.data.gov.au/def/data-roles/custodian> ;
                                        prov:agent ?agent .
                                    ?agent prov:contributed ?idgf .
                                    ?idgf sdo:additionalType <https://data.idnau.org/pid/vocab/policy-types/indigenous-data-governance> .
                                }`,
                    },
                ],
            },
            a3: {
                title: "A3",
                description: "Governance of data",
                prerequisites: {
                    conditions: [
                        {
                            title: "A2 has scored fully",
                            key: "a2",
                            value: "max",
                        },
                    ],
                },
                requirements: [
                    {
                        value: 1,
                        description: "Indigeneity = By Indigenous People",
                        query: `ASK {
                                    #iri# dcterms:type <https://data.idnau.org/pid/vocab/indigeneity/by-indigenous-people> .
                                }`,
                    },
                    {
                        value: 1,
                        description: "URL link to an Indigenous Data Governance Framework or Indigenous Data Committee is identified in the metadata record",
                        query: `ASK {
                                    #iri# prov:wasInfluencedBy ?idgf .
                                    ?idgf sdo:additionalType <https://data.idnau.org/pid/vocab/policy-types/indigenous-data-governance> ;
                                        sdo:url ?url .
                                }`,
                    },
                ],
            },
        },
    },
    r: {
        title: "Responsibility",
        description: "Those working with Indigenous data have a responsibility to share how those data are used to support Indigenous Peoples' self-determination and collective benefit.",
        scores: {
            r1: {
                title: "R1",
                description: "For positive relationships",
                requirements: [
                    {
                        value: 1,
                        description: "Indigeneity = By Indigenous People",
                        query: `ASK {
                                    #iri# dcterms:type <https://data.idnau.org/pid/vocab/indigeneity/by-indigenous-people> .
                                }`,
                    },
                    {
                        value: 2,
                        description: "Custodian (Role) Agent information in database has indigeneity = “Indigenous Persons Organisation” OR “Owned By Indigenous Persons” OR “Run By Indigenous Persons”",
                        query: `ASK {
                                    VALUES ?indigeneity {
                                        <https://data.idnau.org/pid/vocab/org-indigeneity/run-by-indigenous-persons>
                                        <https://data.idnau.org/pid/vocab/org-indigeneity/owned-by-indigenous-persons>
                                        <https://data.idnau.org/pid/vocab/org-indigeneity/indigenous-persons-organisation>
                                    }
                                    #iri# prov:qualifiedAttribution ?agentRole .
                                    ?agentRole dcat:hadRole <https://linked.data.gov.au/def/data-roles/custodian> ;
                                        prov:agent ?agent .
                                    ?agent dcterms:type ?indigeneity .
                                }`,
                    },
                ],
            },
            r2: {
                title: "R2",
                description: "For expanding capability and capacity",
                prerequisites: {
                    conditions: [
                        {
                            title: "R1 has scored fully",
                            key: "r1",
                            value: "max",
                        },
                    ],
                },
                requirements: [
                    {
                        value: 2,
                        description: "Custodian (Role) Agent has identified a resolvable URL link to, OR text description of, an Indigenous Data Governance Framework or Indigenous Data Committee in the metadata record",
                        query: `ASK {
                                    #iri# prov:qualifiedAttribution ?agentRole .
                                    ?agentRole dcat:hadRole <https://linked.data.gov.au/def/data-roles/custodian> ;
                                        prov:agent ?agent .
                                    ?agent prov:contributed ?idgf .
                                    ?idgf sdo:additionalType <https://data.idnau.org/pid/vocab/policy-types/indigenous-data-governance> ;
                                        sdo:url|sdo:description ?o .
                                }`,
                    },
                ],
            },
            r3: {
                title: "R3",
                description: "For Indigenous languages and worldviews",
                prerequisites: {
                    conditions: [
                        {
                            title: "R1 has scored fully",
                            key: "r1",
                            value: "max",
                        },
                    ],
                },
                requirements: [
                    {
                        value: 2,
                        description: "C3 has scored fully",
                        conditions: [
                            {
                                title: "C3 has scored fully",
                                key: "c3",
                                value: "max",
                            },
                        ]
                    },
                    {
                        value: 1,
                        description: "Custodian (Role) Agent has identified a resolvable URL link to, OR text description of, an Indigenous Data Governance Framework or Indigenous Data Committee in the metadata record",
                        query: `ASK {
                                    #iri# prov:qualifiedAttribution ?agentRole .
                                    ?agentRole dcat:hadRole <https://linked.data.gov.au/def/data-roles/custodian> ;
                                        prov:agent ?agent .
                                    ?agent prov:contributed ?idgf .
                                    ?idgf sdo:additionalType <https://data.idnau.org/pid/vocab/policy-types/indigenous-data-governance> ;
                                        sdo:url ?url .
                                }`,
                    },
                    {
                        value: 1,
                        description: "Spatial geometry has been identified",
                        query: `ASK { #iri# dcterms:spatial ?spatial }`,
                    },
                    {
                        value: 1,
                        description: "At least two themes have been selected",
                        query: `ASK { #iri# dcat:theme ?theme }`,
                    },
                ],
            },
        },
    },
    e: {
        title: "Ethics",
        description: "Indigenous Peoples' rights and wellbeing should be the primary concern at all stages of the data life cycle and across the data ecosystem.",
        scores: {
            e1: {
                title: "E1",
                description: "For minimising harm and maximising benefit",
                requirements: [
                    {
                        value: 2,
                        description: "C3 has scored fully",
                        conditions: [
                            {
                                title: "C3 has scored fully",
                                key: "c3",
                                value: "max",
                            },
                        ]
                    },
                    {
                        value: 1,
                        description: "A1 has scored fully",
                        conditions: [
                            {
                                title: "A1 has scored fully",
                                key: "a1",
                                value: "max",
                            },
                        ]
                    },
                ],
            },
            e2: {
                title: "E2",
                description: "For justice",
                prerequisites: {
                    conditions: [
                        {
                            title: "E1 has scored fully",
                            key: "e1",
                            value: "max",
                        },
                    ],
                },
                requirements: [
                    {
                        value: 2,
                        description: "A3 has scored fully",
                        conditions: [
                            {
                                title: "A3 has scored fully",
                                key: "a3",
                                value: "max",
                            },
                        ]
                    },
                    {
                        value: 1,
                        description: "Custodian (Role) Agent’s information in database has ONLY Indigeneity = “Indigenous Persons Organisation”",
                        query: `ASK {
                                    #iri# prov:qualifiedAttribution ?agentRole .
                                    ?agentRole dcat:hadRole <https://linked.data.gov.au/def/data-roles/custodian> ;
                                        prov:agent ?agent .
                                    ?agent dcterms:type <https://data.idnau.org/pid/vocab/org-indigeneity/indigenous-persons-organisation> .
                                }`,
                    },
                ],
            },
            e3: {
                title: "E3",
                description: "For future use",
                prerequisites: {
                    conditions: [
                        {
                            title: "E1 has scored fully",
                            key: "e1",
                            value: "max",
                        },
                        {
                            title: "R3 has scored fully",
                            key: "r3",
                            value: "max",
                        },
                    ],
                },
                requirements: [
                    {
                        value: 1,
                        description: "The date that the data was created and modified are identified",
                        query: `ASK {
                                    #iri# dcterms:created ?created ;
                                        dcterms:modified ?modified .
                                }`,
                    },
                    {
                        value: 1,
                        description: "Name AND point of contact (Email OR Phone) is identified",
                        query: `ASK {
                                    #iri# prov:qualifiedAttribution ?agentRole .
                                    ?agentRole dcat:hadRole <https://linked.data.gov.au/def/data-roles/pointOfContact> ;
                                        prov:agent ?agent .
                                    ?agent sdo:name ?name .
                                }`,
                    },
                ],
            },
        },
    },
};

export default careRules;