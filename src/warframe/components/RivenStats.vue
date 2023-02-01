<script setup>
    import { rivenStats } from "../data/rivenStats.js";
    import { ref, computed } from "vue";
    const selectedType = ref(Object.keys(rivenStats)[0]);
    const positives = computed(
        () => Object.entries(rivenStats[selectedType.value])
              .filter(([_, s]) => !s.onlyNegative)
              .map(getRange(true))
    );
    const negatives = computed(
        () => Object.entries(rivenStats[selectedType.value])
              .filter(([_, s]) => !s.onlyPositive)
              .map(getRange(false))
    );
    const positiveCount = ref(2);
    const hasNegative = ref(true);
    const rivenRank = ref(8);
    const disposition = ref(1);
    function getRange(positive){
        return ([k, v]) => {
            let value = v.value ?? v;
            let unit = v.unit ?? '%';
            let multiplier = positive ?
                                positiveCount.value == 2 ?
                                    hasNegative.value ? 
                                        1.2375 : 0.99
                                    :
                                    hasNegative.value ?
                                        0.9375 : 0.75
                                :
                                hasNegative.value ?
                                    positiveCount.value == 2 ?
                                        -0.495 : -0.75
                                    : 0;
            multiplier *= disposition.value;
            multiplier *= (rivenRank.value + 1) / 9;
            let min = 0.9 * multiplier * value;
            let max = 1.1 * multiplier * value;
            let rnd = x => Math.round(x * 100) / 100;
            return [k, `${rnd(min)}${unit} - ${rnd(max)}${unit}`];
        }
    }
</script>

<template>
    <main>
        <fieldset class="settings">
            <div>
                <label>Weapon type: 
                    <select v-model="selectedType">
                        <option v-for="weaponType of Object.keys(rivenStats)" :value="weaponType">{{ weaponType[0].toLocaleUpperCase() + weaponType.substring(1) }}</option>
                    </select>
                </label>
                <label><input type="radio" value="2" v-model="positiveCount" /> 2 positives</label>
                <label><input type="radio" value="3" v-model="positiveCount" /> 3 positives</label>
            </div>
            <div>
                <label><input type="checkbox" v-model="hasNegative" /> negative</label>
                <label>Rank {{ rivenRank }} <input type="range" min="0" max="8" v-model.number="rivenRank"/></label>
                <label>Disposition: <input type="number" step=".01" min="0.5" max="2" v-model="disposition" /></label>
            </div>
        </fieldset>
        <div>
            <h1>Positives:</h1>
            <ul>
                <li v-for="[stat, range] of positives">{{ stat }}: <span class="float-right">{{ range }}</span></li>
            </ul>
        </div>
        <div v-if="hasNegative">
            <h1>Negatives:</h1>
            <ul>
                <li v-for="[stat, range] of negatives">{{ stat }}: <span class="float-right">{{ range }}</span></li>
            </ul>
        </div>
    </main>
</template>

<style scoped lang="scss">
    @import './../../assets/sliders.scss';
    .settings{
        display:grid;
        border:0;
        grid-template-columns: 1fr 1fr;
        column-gap: 12px;
        
        label {
            display:flex;
            input{
                margin-right: 8px;
                background-color: var(--color-background);
            }
            input:is([type=number], [type=range]), select{
                flex-grow: 1;
                margin-left: 12px;
                margin-right: 0;
                color: var(--hl-color);
                background-color: var(--hl-background-color);
                border:0;
                option {
                    background-color: var(--hl-background-option-color);
                }
            }
        }
        label + label{
            margin-top: 3px;
        }
    }
    .float-right{
        float: right;
    }
    li{
        transition: 0.4s;
        &:hover{
            color:var(--hl-color);
            border-bottom: 1px solid var(--hl-color);
        }
    }
</style>