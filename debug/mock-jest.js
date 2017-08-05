// Dev node: Come on!!! this is super ugly...
// If you find a stable way to debug the jest tests please fork me!
// As documented here: https://facebook.github.io/jest/docs/troubleshooting.html is not working as far of May/17

if (typeof global === 'undefined' && typeof window !== 'undefined') global = window;

global._mockJest = null;

global.clearTest = () => {
  global._mockJest = {
    errors: 0,
    passed: 0,
    descriptions: []
  };
};
global.clearTest();

global.describe = (description, cbDefineIts) => {
  global._mockJest.descriptions.push({
    description,
    its: []
  });

  cbDefineIts();
  startTests();
};

global.it = (description, cbTest) => {
  global._mockJest.descriptions[global._mockJest.descriptions.length - 1].its.push({
    description,
    cbTest
  });
  startTests();
};


global.expect = (valueA) => {
  return comparisons(valueA);
};

let comparisons = (valueA, not = false) => {
  return {
    get not() {
      return comparisons(valueA, true)
    },
    toBe: (valueB) => {
      let result = valueA === valueB;
      if (not) result = !result;
      if (result) {
        console.log('        Success, equal value');
        global._mockJest.passed++;
      }
      else {
        console.log('        FAILED, equal value');
        global._mockJest.errors++;
      }
    }
  }
};

let startTimer = null;
function startTests() {
  if (startTimer) clearTimeout(startTimer);
  startTimer = setTimeout(executeTests, 100);
}

function executeTests() {
  let completedDecritpions = 0;
  console.log('### TESTs begin');

  global._mockJest.descriptions.forEach(description => {
    console.log('Description::: Start:', description.description);
    let its = [].concat(description.its);

    executeAnIt(its, () => {
      completedDecritpions++;
      console.log('Description::: Finished:', description.description);

      if (completedDecritpions === global._mockJest.descriptions.length) {
        console.log('### All TEST finished, results', global._mockJest);
      }
    });
  });
}

function executeAnIt(its, cbCompleted) {
  let it = its.shift();
  if (!it){
    cbCompleted();
    return;
  }

  console.log('    it:::', it.description);
  if (it.cbTest.length === 0) {
    it.cbTest();
    executeAnIt(its, cbCompleted);
  }
  else{
    it.cbTest(()=>{
      executeAnIt(its, cbCompleted);
    });
  }
}
