/*\
title: $:/plugins/midorum/zest/modules/utils.js
type: application/javascript
module-type: utils

Utility functions.

\*/
(function () {

  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  const GENERATE_TITLE_OPTIONS = { "prefix": "" };

  function trim(str) {
    return (str || "").trim();
  }

  function trimToNull(str) {
    if (!str) return null;
    str = str.trim();
    return str ? str : null;
  }

  function trimToUndefined(str) {
    if (!str) return undefined;
    str = str.trim();
    return str ? str : undefined;
  }

  function parseInteger(value, def) {
    if (!value) return def;
    if (Number.isInteger(value)) return value;
    if (typeof value === "string") {
      const parsed = Number.parseInt(value);
      if (Number.isInteger(parsed)) {
        return parsed;
      }
    }
    return def;
  }

  function parseJson(jsonString) {
    try {
      const o = JSON.parse(jsonString);
      if (o && typeof o === "object") return o;
    } catch (e) { }
    return undefined;
  };

  function parseWikiDate(d) {
    var value = $tw.utils.parseDate(d);
    if (value && $tw.utils.isDate(value) && value.toString() !== "Invalid Date") {
      return value;
    }
    return undefined;
  }

  function purgeArray(srcArray, purgeArray) {
    if (!srcArray || !purgeArray || !Array.isArray(srcArray) || !Array.isArray(purgeArray)) return undefined;
    return srcArray.filter(el => !purgeArray.includes(el));
  }

  function parseStringList(value, allowDuplicate) {
    return $tw.utils.parseStringArray(value, allowDuplicate);
  }

  function stringifyList(valueOrValues) {
    return $tw.utils.stringifyList(valueOrValues);
  }

  function formatString(str, ...arr) {
    return str.replace(/%(\d+)/g, function (_, i) {
      return arr[--i];
    });
  }

  // Sequence generator function (commonly referred to as "range", cf. Python, Clojure, etc.)
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from#sequence_generator_range
  // Generate a sequence of numbers from 0 (inclusive) to 5 (exclusive), incrementing by 1
  // range(0, 5, 1); => [0, 1, 2, 3, 4]
  // Generate a sequence of numbers from 1 (inclusive) to 10 (exclusive), incrementing by 2
  // range(1, 10, 2); => [1, 3, 5, 7, 9]
  // Generate the Latin alphabet making use of it being ordered as a sequence
  // range("A".charCodeAt(0), "Z".charCodeAt(0) + 1, 1).map((x) => String.fromCharCode(x),); => ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]
  const range = (start, stop, step) =>
    Array.from(
      { length: Math.ceil((stop - start) / step) },
      (_, i) => start + i * step,
    );

  // Below are wiki-sensitive functions
  function getWikiUtils(wiki) {

    function getTitleAndInstance(titleOrTiddler) {
      return (titleOrTiddler instanceof $tw.Tiddler) ? {
        title: titleOrTiddler.fields.title,
        instance: titleOrTiddler
      } : {
        title: titleOrTiddler,
        instance: wiki.getTiddler(titleOrTiddler)
      };
    }

    function allTitlesWithTag(tag) {
      tag = trimToUndefined(tag);
      if (!tag) return undefined;
      return wiki.getTiddlersWithTag(tag);
    }

    function filterTiddlers(filterString, widget, source) {
      return wiki.filterTiddlers(filterString, widget, source);
    }

    function generateNewInternalTitle(prefix) {
      return wiki.generateNewTitle(prefix + Date.now(), GENERATE_TITLE_OPTIONS);
    }

    function addTiddler(fields) {
      wiki.addTiddler(new $tw.Tiddler(
        wiki.getCreationFields(),
        fields,
        wiki.getModificationFields()));
    }

    function withTiddler(titleOrTiddler, lenient) {
      if (!titleOrTiddler && !lenient) throw new Error("title or tiddler is required");
      const tiddler = titleOrTiddler ? getTitleAndInstance(titleOrTiddler) : { title: undefined, instance: undefined };
      var locked = false;

      function check() {
        if (!tiddler.title) throw new Error("The tiddler is undefined");
      }

      function lock() {
        if (locked) throw new Error("The tiddler is already locked");
        locked = true;
      }

      // to delete an existing field from the tiddler we should set this field in the 'fields' parameter to undefined
      function updateTiddler(fields) {
        if (!fields) throw new Error("fields parameter is required");
        check();
        lock();
        wiki.addTiddler(new $tw.Tiddler(
          tiddler.instance ? tiddler.instance : { title: tiddler.title },
          fields,
          wiki.getModificationFields()));
      };

      function listFields() {
        check();
        return tiddler.instance ? Object.keys(tiddler.instance.fields) : [];
      }

      function getTiddlerTagsShallowCopy() {
        check();
        return tiddler.instance ? (tiddler.instance.fields.tags || []).slice(0) : [];
      }

      function getTiddlerField(field, defaultValue) {
        check();
        return (tiddler.instance && field) ? tiddler.instance.getFieldString(field, defaultValue) : defaultValue;
      }

      function getTiddlerData(defaultData) {
        check();
        return (tiddler.instance) ? wiki.getTiddlerDataCached(tiddler.instance, defaultData) : wiki.getTiddlerDataCached(tiddler.title, defaultData);
      }

      return {
        exists: () => !!tiddler.instance,
        getTitle: () => tiddler.title,
        listFields: listFields,
        toJSON: () => JSON.stringify(tiddler.instance.fields),
        getTiddlerTagsShallowCopy: getTiddlerTagsShallowCopy,
        getTiddlerField: getTiddlerField,
        getTiddlerData: getTiddlerData,
        getTiddlerDataOrEmpty: () => getTiddlerData(Object.create(null)),
        getTiddlerDataByIndex: (index, defaultValue) => {
          if (!index) throw new Error("index parameter is required");
          return (tiddler.instance) ? wiki.extractTiddlerDataItem(tiddler.instance, index, defaultValue) : wiki.extractTiddlerDataItem(tiddler.title, index, defaultValue);
        },
        // Below are non-pure unsafe functions that use TiddlyWiki message mechanism - they all shouldn't be invoked sequentially for the same tiddler
        doNotInvokeSequentiallyOnSameTiddler: {
          updateTiddler: updateTiddler,
          deleteTiddler: function () {
            check();
            lock();
            wiki.deleteTiddler(tiddler.title);
          },
          addTagsToTiddler: function (tags) {
            if (!tags) throw new Error("tags parameter is required");
            const tagsToAdd = ($tw.utils.isArray(tags) ? tags : [tags]).filter(tag => tag);
            const tiddlerTags = getTiddlerTagsShallowCopy();
            updateTiddler({
              tags: tiddlerTags.concat(purgeArray(tagsToAdd, tiddlerTags))
            })
          },
          deleteTagsToTiddler: function (tags) {
            if (!tags) throw new Error("tags parameter is required");
            const tagsToDelete = ($tw.utils.isArray(tags) ? tags : [tags]).filter(tag => tag);
            updateTiddler({
              tags: purgeArray(getTiddlerTagsShallowCopy(), tagsToDelete)
            });
          },
          setTiddlerField: function (field, value) {
            if (!field) throw new Error("field parameter is required");
            const data = {};
            data[field] = value;
            updateTiddler(data);
          },
          // not tested
          appendTiddlerField: function (field, value, separator) {
            if (!field) throw new Error("field parameter is required");
            if (tiddler.instance) {
              const current = getTiddlerField(field);
              if (current && separator) {
                wiki.setText(tiddler.title, field, undefined, current + separator + value, {});
              } else if (current) {
                wiki.setText(tiddler.title, field, undefined, current + value, {});
              } else {
                wiki.setText(tiddler.title, field, undefined, value, {});
              }
            } else {
              wiki.setText(tiddler.title, field, undefined, value, {});
            }
          },
          // Sets a tiddler's content to a JavaScript object. Creates tiddler if it does not exist.
          setOrCreateTiddlerData: function (dataObj) {
            if (!dataObj) throw new Error("tiddler data are required");
            check();
            lock();
            const data = wiki.getTiddlerData(tiddler.title, Object.create(null));
            Object.entries(dataObj).forEach(([key, value]) => {
              if (value !== undefined) {
                data[key] = value;
              } else {
                delete data[key];
              }
            });
            wiki.setTiddlerData(tiddler.title, data, {}, {});
          },
        }
      };
    }

    return {
      wiki: wiki,
      filterTiddlers: filterTiddlers,
      allTitlesWithTag: allTitlesWithTag,
      generateNewInternalTitle: generateNewInternalTitle,
      addTiddler: addTiddler,
      withTiddler: withTiddler,
    };

  }

  exports.zestUtils = {
    trim: trim,
    trimToNull: trimToNull,
    trimToUndefined: trimToUndefined,
    parseInteger: parseInteger,
    parseJson: parseJson,
    parseWikiDate: parseWikiDate,
    purgeArray: purgeArray,
    parseStringList: parseStringList,
    stringifyList: stringifyList,
    formatString: formatString,
    range: range,
    getWikiUtils: getWikiUtils,
  };

})();