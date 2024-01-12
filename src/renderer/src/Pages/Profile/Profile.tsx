import AvatarComponent from "@renderer/Compontents/AvatarComponent";
import { ProfileInterface } from "@renderer/lib/interfaces";
import { getUserProfile, updateAvatar, updateSettings } from "@renderer/lib/user";
import { motion, useIsPresent } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  TbBook,
  TbBriefcase,
  TbEdit,
  TbFile,
  TbFolder,
  TbPlus,
  TbSettingsFilled
} from "react-icons/tb/";
import Input from "@renderer/Layout/Input";
import Button from "@renderer/Layout/Button";
import toast from "react-hot-toast";
import { useAtomValue } from "jotai";
import { userAtom } from "@renderer/lib/atoms";
import Overview from "./Pages/Overview";
import Rules from "./Pages/Rules";
import Rulesets from "./Pages/Rulesets";
import Enviroments from "./Pages/Enviroments";
import AvatarEditModal from "./Components/Modals/AvatarEditModal";
import ManageContentModal from "./Components/Modals/ManageContentModal";

type site = "Main" | "Rules" | "Rulesets" | "Enviroments";

export default function Profile(): JSX.Element {
  const [userData, setUserData] = useState<ProfileInterface>();
  const [site, setSite] = useState<site>("Main");
  const [isUserChangingSettings, setIsUserChangingSettings] = useState<boolean>(false);
  const [isUserAddingContent, setIsUserAddingContent] = useState<boolean>(false);
  const [isUserChangingAvatar, setIsUserChangingAvatar] = useState<boolean>(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [avatarBlob, setAvatarBlob] = useState<Blob>();
  const loggedUserData = useAtomValue(userAtom);

  const { userId = 0 } = useParams<{ userId: string }>();
  const isPresent = useIsPresent();

  const usernameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const newAvatarRef = useRef<any>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loggedUserData.id) {
      setIsUserChangingSettings(false);
    }
  }, [loggedUserData]);

  async function fetchData(): Promise<void> {
    const data = await getUserProfile(+userId);
    if (data.username) {
      setUserData(data);
    }
  }

  function handleReactingWithSettings(): void {
    if (!isUserChangingSettings) {
      setIsUserChangingSettings(true);
    } else {
      if (usernameRef.current && descriptionRef.current) {
        if (
          usernameRef.current.value === userData?.username &&
          descriptionRef.current.value === userData?.description &&
          !avatarBlob
        ) {
          setIsUserChangingSettings(false);
        } else if (
          confirm(
            "You have unsaved changes! Do you want to close settings? Unsaved changes will be lost."
          )
        ) {
          setAvatarBlob(undefined);
          setIsUserChangingSettings(false);
        }
      }
    }
  }

  async function handleSaveSettings(): Promise<void> {
    if (usernameRef.current && descriptionRef.current) {
      const username = usernameRef.current.value;
      const description = descriptionRef.current.value;
      if (username === "") {
        toast.error("Username can't be empty!");
        return;
      }
      if (description === userData?.description && username === userData?.username && !avatarBlob) {
        setIsUserChangingSettings(false);
        return;
      }
      const toastId = toast.loading("Updating...");
      const isSettingsStatusOk = await updateSettings({
        username,
        description
      });
      if (avatarBlob) {
        handleAvatarChange();
      }
      if (isSettingsStatusOk) {
        toast.success("Settings saved!", {
          id: toastId
        });
        fetchData();
        setIsUserChangingSettings(false);
      } else {
        toast.error("Failed to save settings!", {
          id: toastId
        });
      }
    }
  }

  async function handleAvatarChange(): Promise<void> {
    if (!avatarBlob) return;
    const avatarFile = new File([avatarBlob], "avatar.png", {
      type: "image/png"
    });
    const avatarFormData = new FormData();
    avatarFormData.append("avatar", avatarFile);
    const avatarStatusOk = await updateAvatar(avatarFormData);
    if (avatarStatusOk) {
      toast.success("Avatar updated succesfully");
    } else {
      toast.error("Failed to save avatar");
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function handleAddingContent(): void {
    setIsUserAddingContent(!isUserAddingContent);
  }

  function handleUserChaningAvatar(): void {
    setIsUserChangingAvatar(!isUserChangingAvatar);
    clearFileInput();
  }

  function clearFileInput(): void {
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  }

  function tabClasses(tab: site): string {
    return `font-roboto transition-all px-8 py-2 w-full border-b-2 flex items-center gap-2 justify-center ${
      site === tab
        ? "text-gray-300 border-sky-400"
        : "text-gray-400 cursor-pointer hover:border-sky-700 border-bgLight hover:bg-bgLight"
    }`;
  }

  function displayCorrectSite(): JSX.Element {
    switch (site) {
      case "Main":
        return <Overview />;
      case "Rules":
        return <Rules />;
      case "Rulesets":
        return <Rulesets />;
      case "Enviroments":
        return <Enviroments />;
    }
  }

  function saveAvatarImage(): void {
    if (!newAvatarRef.current) return;
    const canvas: HTMLCanvasElement = newAvatarRef.current?.getImage();
    canvas.toBlob((blob): void => {
      if (!blob) return;
      setAvatarUrl(URL.createObjectURL(blob));
      setAvatarBlob(blob);
    });
    clearFileInput();
    setIsUserChangingAvatar(false);
  }

  function uploadAvatar(e: any): void {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      toast.error("Only .png and .jpeg files are allowed!");
      clearFileInput();
      return;
    }
    setAvatarUrl(URL.createObjectURL(file));
    setIsUserChangingAvatar(true);
  }

  return (
    <div className="flex-1 w-4/5 mx-auto flex flex-col px-16 overflow-y-auto my-4">
      {isUserAddingContent && <ManageContentModal closeModal={handleAddingContent} />}
      {isUserChangingAvatar && (
        <AvatarEditModal
          closeModal={handleUserChaningAvatar}
          newAvatarRef={newAvatarRef}
          avatarUrl={avatarUrl}
          saveAvatarImage={saveAvatarImage}
        />
      )}
      <div className="w-full pb-8 flex gap-8 py-8">
        <div className="h-fit w-1/4 flex flex-col gap-4 px-8 py-8 duration-300 relative bg-bgColor">
          {loggedUserData?.id === +userId && (
            <TbSettingsFilled
              onClick={handleReactingWithSettings}
              className="absolute right-4 top-4 text-2xl text-gray-400 transition-all hover:text-sky-500 hover:rotate-45 cursor-pointer duration-300"
            />
          )}
          <div className="relative">
            {avatarBlob ? (
              <img src={URL.createObjectURL(avatarBlob)} className="rounded-full peer w-72 h-72" />
            ) : (
              <AvatarComponent
                username={userData?.username || ""}
                size="big"
                className="peer shadow-darkMain"
                userId={+userId}
              />
            )}
            <input
              type="file"
              name="avatarImage"
              id="avatarImage"
              className="hidden"
              onChange={uploadAvatar}
              defaultValue={avatarUrl}
              ref={avatarInputRef}
            />
            {isUserChangingSettings && (
              <label
                htmlFor="avatarImage"
                className="absolute inset-0 rounded-full bg-black bg-opacity-60 hidden peer-hover:flex hover:flex justify-center items-center text-white text-5xl cursor-pointer"
              >
                <TbEdit />
              </label>
            )}
          </div>
          <div className="flex flex-col gap-4 w-full">
            {isUserChangingSettings ? (
              <>
                <Input
                  placeholder="Username"
                  value={userData?.username}
                  ref={usernameRef}
                  max={16}
                />
                <textarea
                  placeholder="Description"
                  defaultValue={userData?.description}
                  className="font-poppins max-h-72 block p-2 w-full text-lg duration-300 text-white bg-transparent rounded-lg border-2 appearance-none focus:outline-none focus:ring-0 peer transition-colors focus:border-sky-500 border-gray-500"
                  ref={descriptionRef}
                />
                <Button theme="default" className="!w-full" onClick={handleSaveSettings}>
                  Save
                </Button>
              </>
            ) : (
              <>
                <h1 className="text-gray-100 text-4xl font-roboto">{userData?.username}</h1>
                <p className="text-gray-400 text-lg font-poppins line-clamp-4">
                  {userData?.description || "This user has no description yet!"}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="h-full w-[2px] bg-bgLight rounded-full" />
        <div className="flex-1 gap-8 h-fit duration-300 text-xl text-gray-100 font-roboto bg-bgColor">
          <div className="flex items-center justify-between relative">
            <p onClick={() => setSite("Main")} className={tabClasses("Main") + " rounded-tl-lg"}>
              <TbBook />
              OVERVIEW
            </p>
            <p onClick={() => setSite("Rules")} className={tabClasses("Rules")}>
              <TbFile />
              RULES
            </p>
            <p onClick={() => setSite("Rulesets")} className={tabClasses("Rulesets")}>
              <TbFolder />
              RULESETS
            </p>
            <p
              onClick={() => setSite("Enviroments")}
              className={tabClasses("Enviroments") + " rounded-tr-lg"}
            >
              <TbBriefcase />
              ENVIROMENTS
            </p>
            {loggedUserData?.id === +userId && (
              <p
                onClick={handleAddingContent}
                className="absolute w-8 h-8 transition-colors duration-300 text-white bg-sky-500 hover:bg-sky-700 -right-10 rounded-full flex items-center justify-center cursor-pointer"
              >
                <TbPlus />
              </p>
            )}
          </div>
          <div className="flex flex-col gap-8 p-4 text-gray-400">{displayCorrectSite()}</div>
        </div>
      </div>
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0, transition: { duration: 0.6, ease: "circOut" } }}
        exit={{ scaleX: 1, transition: { duration: 0.6, ease: "circIn" } }}
        style={{ originX: isPresent ? 0 : 1 }}
        className="privacy-screen z-50"
      />
    </div>
  );
}