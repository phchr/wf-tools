<script setup>
import { ref, reactive, computed, onBeforeMount } from 'vue';
const items = ref([]);
const sortBy = reactive({
  key: 'name',
  ascending: true
});
const sortedItems = computed(() => {
  return [...items.value].sort((a, b) => {
    let [ia, ib] = [a[sortBy.key], b[sortBy.key]];
    switch (sortBy.key){
      case 'name': return sortBy.ascending ? ia > ib : ib > ia;
      case 'ducats': return sortBy.ascending ? ia - ib : ib - ia;
      case 'plat':
      case 'ratio': return sortBy.ascending ? (ia ?? Infinity) - (ib ?? Infinity) : (ib ?? -Infinity) - (ia ?? -Infinity)
      default: throw Error('Sort key type error:', sortBy.key);
    }
  });
});
function setSort(e){
  let {target:t, target:{attributes:a}} = e;
  if (a.nosort || !t.matches('th')) return false;
  if (a.name.value == sortBy.key) sortBy.ascending = !sortBy.ascending;
  else {
    sortBy.key = a.name.value;
    sortBy.ascending = true;
  }
}
onBeforeMount(getData);
async function getData(){
  //retrieve then parse data from table at warframe wiki
  items.value.length = 0;
  let table = await fetch('/wf-wiki/Ducats/Prices/All').then(x => x.text()).then(x => new DOMParser().parseFromString(x, 'text/html').querySelector('tbody'));
  items.value = [...table.children].map(c => ({
    name: c.children[0].innerText,
    drop: [...c.children[1].childNodes].reduce((a, n) => {
      if (!a.length) return (a.push({name: n.innerText}), a);
      if (n.nodeName == 'BR') return (a.push({}), a);
      if (n.nodeName == 'A'){
        if (!('name' in a[a.length - 1])) return (a[a.length - 1].name = n.innerText, a);
        return (a[a.length - 1].vaulted = true, a);
      }
      if (!('rarity' in a[a.length - 1])) return (a[a.length - 1].rarity = n.textContent.replaceAll(' (', ''), a);
      return a;
    }, []).map(r => ({vaulted: false, ...r})),
    ducats: c.children[2].innerText,
  })).slice(1);
}
async function getPlatValue(item){
  //query warframe.market api for order prices
  if (item.querying) return false;
  item.querying = true;
  let orders = await fetch('/market/items/' + item.name.toLocaleLowerCase().replaceAll(' ', '_').replaceAll('&', 'and').replace(/(neuroptics|chassis|systems)_blueprint/, '$1') + '/orders')
              .then(x => x.json());
  if (orders.error){//market bug workaround
    orders = await fetch('/market/items/' + item.name.toLocaleLowerCase().replaceAll(' ', '_').replaceAll('&', 'and') + '/orders')
              .then(x => x.json());
  }
  if (orders.error){
    item.querying = false;
    return false;
  }
  orders = orders.payload.orders;
  let weighted = orders.map(o => {
    if (o.user.status == 'ingame') o.weight = 10;
    else if (o.user.status == 'online') o.weight = 5;
    else if (Date.now() - Date.parse(o.creation_date) < 30 * 1000 * 3600 * 24) o.weight = 2;
    else o.weight = 0;
    if (o.order_type == 'sell') o.weight *= 2;
    return o; 
  }).filter(o => o.weight).sort((a, b) => a.platinum - b.platinum);
  let margin = Math.max(weighted.length * 0.05, 1);
  let sliced = weighted.slice(margin, -margin);
  if (!sliced.length) {
    item.plat = 0;
    item.ratio = 0;
  }
  else {
    let reduced = orders.reduce((res, o) => {
      res.weight += o.weight;
      res.score += o.platinum * o.weight;
      return res;
    }, {weight: 0, score: 0});
    item.plat = Math.round(reduced.score / reduced.weight * 100) / 100;
    item.ratio = Math.round(item.ducats / item.plat * 100) / 100;
  }
  item.querying = false;
}
</script>

<template>
    <table>
      <tr @click="setSort">
        <th class='hl' name="name">Name</th>
        <th name="vaulted" nosort>Vaulted</th>
        <th class='hl' name="ducats">Ducat Value</th>
        <th class='hl' name="plat">Platinum Value</th>
        <th class='hl' name="ratio">D:P Ratio</th>
      </tr>
      <tr v-for="item in sortedItems">
        <td>{{ item.name }}</td>
        <td>{{ item.drop.every(relic => relic.vaulted) ? 'V ' : '' }}</td>
        <td>{{ item.ducats }}</td>
        <td @click="getPlatValue(item)" class="hl">{{ item.plat ?? (item.querying ? 'querying...' : 'query') }}</td>
        <td>{{ item.ratio ?? '...' }}</td>
      </tr>
    </table>
</template>

<style scoped lang="scss">
  tr{
    &:nth-child(2n){
      background-color: var(--color-background-soft);
    }
    &:nth-child(2n+1){
      background-color: var(--color-background);
    }
    :hover{
      transition: 0.1s;
      filter: brightness(1.15);
      box-shadow: 0 0 0 1px var(--hl-color);
    }
  }
</style>