<script setup>
import { FormInput } from "@idn-au/idn-lib";

const rdfFormats = {
    "ttl": "text/turtle",
    "trig": "application/trig",
    "nt": "application/n-triples",
    "n3": "text/n3"
};

const props = defineProps({
    data: {
        type: String,
        required: true
    }
});

function copyRDF() {
    navigator.clipboard.writeText(props.data.trim())
}

// turtle syntax highlighting

const emit = defineEmits(["import"]);

function setFile(e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
        const extension = file.name.split(".")[1];
        // emit("import", e.target.result);
        emit("import", { format: rdfFormats[extension], value: e.target.result });
    };
    reader.readAsText(file);
}
</script>

<template>
    <FormInput
        type="textarea"
        v-model="props.data"
        disabled
        id="rdf"
    />
    <div class="buttons">
        <button class="btn outline copy-btn" @click="copyRDF">Copy <i class="fa-regular fa-copy"></i></button>
        <input type="file" name="rdfFile" id="rdfFile" accept=".ttl,.trig,.nt,.n3" @change="setFile" hidden>
        <label for="rdfFile" class="btn outline import-btn">Import <i class="fa-regular fa-file-import"></i></label>
    </div>
</template>

<style lang="scss" scoped>
@import "@/assets/_variables.scss";

.form-input, :deep(.input-row), :deep(.form-input-content), :deep(.input-item), :deep(.input-component) {
    flex-grow: 1;
}

.buttons {
    display: flex;
    flex-direction: row;
    gap: 8px;
    align-items: center;

    button.copy-btn {

    }

    label.import-btn {
        font-size: 0.833em;
        font-weight: normal;
        margin-left: auto;
    }
}

:deep(.input-row) {
    flex-direction: column !important;
}

:deep(.input-component) {
    resize: none !important;
    font-family: consolas, monospace !important;
    font-size: 13px;
    padding: 10px !important;
    background-color: white !important;
}
</style>