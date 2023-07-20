// const retrievedObjectsIds = useMemo(() => retrievedObjects.map((x) => x.id), [retrievedObjects]);

/*
  const [processing, setProcessing] = useState(false);
  const [retrievedObjects, setRetrievedObjects] = useState([]);
  // fetch the usernames for all the fileContents[x].id
  useEffect(() => {
    async function processFile() {
      setProcessing(true);
      console.log("Processing file");

      let objs = fileContents.filter((x) => x.name).length
        ? fileContents.filter((x) => x.name).map((x) => ({ name: x.name, id: x.id }))
        : [];

      const missingNames = fileContents.filter((x) => !x.name);
      if (missingNames && missingNames.length) {
        let missingObjs;
        try {
          missingObjs = await getObjects(currentNodes[0], params.env, missingNames.map((x) => x.id));
        } catch (error) {
          console.log(error);
          setProcessing(false);
          return;
        }
        objs = objs.concat(missingObjs.map((x) => ({ name: x.name, id: x.id, allowed_assets: x.allowed_assets })));
      }

      setProcessing(false);
      setRetrievedObjects(objs);
    }

    if (fileContents) {
      processFile();
    }
  }, [fileContents]);
  */

/*
    if (retrievedObjects) {
      const check = retrievedObjectsIds.some((id) => id === user.id);
      if (!check) {
        // Filter out users that don't have a corresponding object in retrievedObjects
        reasons.push("noObject");
      } else {
        // Check if the account is blocking incoming assets!
        // Old disabled account feature
        const foundIndex = retrievedObjectsIds.indexOf(user.id);
        if (foundIndex !== -1 && retrievedObjects[foundIndex].allowed_assets && retrievedObjects[foundIndex].allowed_assets.length) {
          const foundObject = retrievedObjects[foundIndex];
          const foundToken = foundObject.allowed_assets.find(
            (asset) => asset.asset_id === tokenDetails.id
          );
          if (!foundToken) {
            reasons.push("blockedAssets");
          }
        }
      }
    }
  */